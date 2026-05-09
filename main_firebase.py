# main_firebase.py — SpoilerSafe backend using Firebase Firestore
# Drop-in replacement for main.py (SQLAlchemy/SQLite → firebase-admin Firestore)
# All API paths, request shapes and response shapes are identical to the original.

from __future__ import annotations

import json
import os
import re
import shutil
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, date, timedelta

import requests
from dotenv import load_dotenv
from fastapi import (
    Depends, FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import firebase_admin
from firebase_admin import credentials, firestore as fs
from google.cloud.firestore_v1 import FieldFilter

import auth  # keep existing auth.py (create_token, decode_token, get_password_hash, verify_password)

load_dotenv()

# ─── Firebase init ─────────────────────────────────────────────────────────────
_cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
_firebase_cred = credentials.Certificate(_cred_path)
firebase_admin.initialize_app(_firebase_cred)
db = fs.client()

# ─── Ensure _meta/counters exists ─────────────────────────────────────────────
db.collection("_meta").document("counters").set({"user_count": 0}, merge=True)

# ─── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI()

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# ─── Pydantic schemas ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    avatar_url: str | None = None
    banner_url: str | None = None
    bio: str | None = None
    location: str | None = None

class UserProfile(BaseModel):
    id: int
    username: str
    points: int
    level: int
    badges: list[dict]
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    avatar_url: str | None = None
    banner_url: str | None = None
    bio: str | None = None
    location: str | None = None
    rank: str = "Novato"
    next_level_points: int = 100
    level_start_points: int = 0
    spoilers_safe: int = 0
    active_frame: str | None = None
    active_emoji: str | None = None
    active_banner: str | None = None
    is_premium: bool = False
    is_admin: bool = False
    is_banned: bool = False

class EquipRequest(BaseModel):
    active_frame: str | None = None
    active_emoji: str | None = None
    active_banner: str | None = None

class CommentCreate(BaseModel):
    content: str
    timestamp: int = 0

class TimeCapsuleCreate(BaseModel):
    anime_id: int
    unlock_episode: int
    content: str

class RecommendationCreate(BaseModel):
    media_id: int
    media_type: str = "anime"
    title: str
    cover_image: str | None = None
    reason: str

class CrunchyrollCredentials(BaseModel):
    email: str
    password: str

# ─── Achievements catalogue ────────────────────────────────────────────────────
ACHIEVEMENTS_CATALOG = [
    # Anime
    {"key": "primer_episodio",    "name": "Primer Episodio",         "description": "Ver tu primer episodio de anime",     "icon": "play_circle",        "category": "anime",          "stat": "episodes",       "requirement": 1,   "bonus_points": 10},
    {"key": "maratonista",        "name": "Maratonista",             "description": "Ver 100 episodios de anime",           "icon": "smart_display",      "category": "anime",          "stat": "episodes",       "requirement": 100, "bonus_points": 50},
    {"key": "adicto_anime",       "name": "Adicto al Anime",         "description": "Ver 500 episodios de anime",           "icon": "smart_display",      "category": "anime",          "stat": "episodes",       "requirement": 500, "bonus_points": 150},
    # Manga
    {"key": "lector_curioso",     "name": "Lector Curioso",          "description": "Leer tu primer capítulo de manga",    "icon": "menu_book",          "category": "manga",          "stat": "manga_chapters", "requirement": 1,   "bonus_points": 10},
    {"key": "devora_paginas",     "name": "Devora Páginas",          "description": "Leer 100 capítulos de manga",         "icon": "menu_book",          "category": "manga",          "stat": "manga_chapters", "requirement": 100, "bonus_points": 75},
    {"key": "fanatico_manga",     "name": "Fanático del Manga",      "description": "Leer 500 capítulos de manga",         "icon": "auto_stories",       "category": "manga",          "stat": "manga_chapters", "requirement": 500, "bonus_points": 150},
    # Social
    {"key": "stalker_inicial",    "name": "Stalker Inicial",         "description": "Seguir a tu primer usuario",          "icon": "person_add",         "category": "social",         "stat": "following",      "requirement": 1,   "bonus_points": 10},
    {"key": "social_butterfly",   "name": "Social Butterfly",        "description": "Seguir a 10 usuarios",                "icon": "people",             "category": "social",         "stat": "following",      "requirement": 10,  "bonus_points": 30},
    {"key": "influencer",         "name": "Influencer",              "description": "Conseguir 50 seguidores",             "icon": "diversity_3",        "category": "social",         "stat": "followers",      "requirement": 50,  "bonus_points": 100},
    {"key": "comentarista_novato","name": "Comentarista Novato",     "description": "Escribir tu primer comentario",       "icon": "chat",               "category": "social",         "stat": "comments",       "requirement": 1,   "bonus_points": 5},
    {"key": "voz_comunidad",      "name": "Voz de la Comunidad",     "description": "Escribir 50 comentarios",             "icon": "forum",              "category": "social",         "stat": "comments",       "requirement": 50,  "bonus_points": 75},
    {"key": "critico_experto",    "name": "Crítico Experto",         "description": "Escribir 200 comentarios",            "icon": "rate_review",        "category": "social",         "stat": "comments",       "requirement": 200, "bonus_points": 200},
    # Guardian
    {"key": "guardian_spoiler",   "name": "Guardián del Spoiler",    "description": "Reportar 5 spoilers confirmados",     "icon": "shield",             "category": "guardian",       "stat": "spoilers_safe",  "requirement": 5,   "bonus_points": 50},
    {"key": "guardian_elite",     "name": "Guardián Élite",          "description": "Reportar 25 spoilers confirmados",    "icon": "verified_user",      "category": "guardian",       "stat": "spoilers_safe",  "requirement": 25,  "bonus_points": 150},
    # Gaming
    {"key": "primer_juego",       "name": "¡A Jugar!",               "description": "Jugar tu primer juego",               "icon": "sports_esports",     "category": "gaming",         "stat": "games",          "requirement": 1,   "bonus_points": 15},
    {"key": "gamer_otaku",        "name": "Gamer Otaku",             "description": "Jugar 5 juegos distintos",            "icon": "videogame_asset",    "category": "gaming",         "stat": "games",          "requirement": 5,   "bonus_points": 50},
    # Recommendations (requires level 5)
    {"key": "primera_recomendacion","name": "Primera Recomendación", "description": "Hacer tu primera recomendación",      "icon": "recommend",          "category": "recomendaciones","stat": "recommendations","requirement": 1,   "bonus_points": 20},
    {"key": "embajador",          "name": "Embajador del Anime",     "description": "Hacer 10 recomendaciones",            "icon": "campaign",           "category": "recomendaciones","stat": "recommendations","requirement": 10,  "bonus_points": 100},
    # Level milestones
    {"key": "nivel_5",            "name": "Aventurero Desbloqueado", "description": "Alcanzar el nivel 5",                 "icon": "military_tech",      "category": "hito",           "stat": "level",          "requirement": 5,   "bonus_points": 50},
    {"key": "nivel_10",           "name": "Veterano",                "description": "Alcanzar el nivel 10",                "icon": "military_tech",      "category": "hito",           "stat": "level",          "requirement": 10,  "bonus_points": 100},
    {"key": "nivel_20",           "name": "Héroe Consagrado",        "description": "Alcanzar el nivel 20",                "icon": "emoji_events",       "category": "hito",           "stat": "level",          "requirement": 20,  "bonus_points": 200},
]

# ─── Rewards catalogue ─────────────────────────────────────────────────────────
REWARDS_CATALOG = [
    # Avatar frames
    {"key": "frame_default",    "name": "Marco Clásico",      "type": "frame",  "description": "El marco por defecto",              "unlock_type": "default", "unlock_value": 0,    "preview_color": "#e5e7eb"},
    {"key": "frame_dorado",     "name": "Marco Dorado",       "type": "frame",  "description": "Marco dorado para aventureros",     "unlock_type": "level",   "unlock_value": 5,    "preview_color": "#f59e0b"},
    {"key": "frame_plateado",   "name": "Marco Plateado",     "type": "frame",  "description": "Elegancia de acero",                "unlock_type": "level",   "unlock_value": 10,   "preview_color": "#94a3b8"},
    {"key": "frame_epico",      "name": "Marco Épico",        "type": "frame",  "description": "Para los héroes del anime",         "unlock_type": "level",   "unlock_value": 20,   "preview_color": "#8b5cf6"},
    {"key": "frame_legendario", "name": "Marco Legendario",   "type": "frame",  "description": "Solo para leyendas",                "unlock_type": "level",   "unlock_value": 30,   "preview_color": "#ef4444"},
    {"key": "frame_guardian",   "name": "Marco The Guardian", "type": "frame",  "description": "El honor supremo de SpoilerSafe",  "unlock_type": "level",   "unlock_value": 50,   "preview_color": "#f97316"},
    # Profile banners
    {"key": "banner_sakura",    "name": "Banner Sakura",      "type": "banner", "description": "Pétalos de sakura en el viento",    "unlock_type": "points",  "unlock_value": 500,  "preview_color": "#fce7f3", "image": "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80&fit=crop&h=200"},
    {"key": "banner_mecha",     "name": "Banner Mecha",       "type": "banner", "description": "El poder de los robots gigantes",   "unlock_type": "points",  "unlock_value": 1000, "preview_color": "#dbeafe", "image": "https://i.pinimg.com/736x/5e/bc/3e/5ebc3e092b95a335ee0728b6d80e566b.jpg"},
    {"key": "banner_academy",   "name": "Banner Academia",    "type": "banner", "description": "El camino del héroe escolar",       "unlock_type": "points",  "unlock_value": 2500, "preview_color": "#fef3c7", "image": "https://i.pinimg.com/736x/a4/de/6c/a4de6c2e0a8ab62c126e849e0f0695c6.jpg"},
    {"key": "banner_forest",    "name": "Banner Bosque Ninja","type": "banner", "description": "El susurro de los árboles shinobi", "unlock_type": "points",  "unlock_value": 3500, "preview_color": "#d1fae5", "image": "https://i.pinimg.com/1200x/99/ab/64/99ab64665999158c4896946e8b5a50b6.jpg"},
    {"key": "banner_night",     "name": "Banner Night City",  "type": "banner", "description": "Las luces que nunca duermen",       "unlock_type": "points",  "unlock_value": 5000, "preview_color": "#1e1b4b", "image": "https://i.pinimg.com/736x/40/d3/47/40d34772d3c58cc16d0f88d21d24c723.jpg"},
    {"key": "banner_galaxy",    "name": "Banner Galaxia",     "type": "banner", "description": "El universo a tus pies",            "unlock_type": "points",  "unlock_value": 7500, "preview_color": "#0f0a1e", "image": "https://i.pinimg.com/1200x/3c/8c/2f/3c8c2fb05cd4b60b0ea1cce9811cee29.jpg"},
    {"key": "banner_lava",      "name": "Banner Fuego Eterno","type": "banner", "description": "El calor de la determinación",      "unlock_type": "points",  "unlock_value": 10000,"preview_color": "#7f1d1d", "image": "https://i.pinimg.com/1200x/51/98/27/519827afa8dd12f758bb4dd5ba8213d0.jpg"},
    # Profile emojis
    {"key": "emoji_star",       "name": "⭐ Estrella",        "type": "emoji",  "description": "El clásico de siempre",             "unlock_type": "default", "unlock_value": 0,    "emoji": "⭐"},
    {"key": "emoji_sakura",     "name": "🌸 Sakura",         "type": "emoji",  "description": "Delicado y hermoso",                "unlock_type": "points",  "unlock_value": 100,  "emoji": "🌸"},
    {"key": "emoji_sword",      "name": "🗡️ Espada",         "type": "emoji",  "description": "El filo del guerrero",              "unlock_type": "points",  "unlock_value": 150,  "emoji": "🗡️"},
    {"key": "emoji_wave",       "name": "🌊 Ola",            "type": "emoji",  "description": "Fluye como el agua",                "unlock_type": "points",  "unlock_value": 200,  "emoji": "🌊"},
    {"key": "emoji_katana",     "name": "⚔️ Katana",         "type": "emoji",  "description": "Para los guerreros del anime",      "unlock_type": "points",  "unlock_value": 300,  "emoji": "⚔️"},
    {"key": "emoji_fox",        "name": "🦊 Kitsune",        "type": "emoji",  "description": "El espíritu zorro",                 "unlock_type": "points",  "unlock_value": 400,  "emoji": "🦊"},
    {"key": "emoji_sparkle",    "name": "💫 Destello",        "type": "emoji",  "description": "Brillante como un héroe",           "unlock_type": "points",  "unlock_value": 450,  "emoji": "💫"},
    {"key": "emoji_castle",     "name": "🏯 Castillo",       "type": "emoji",  "description": "El legado samurái",                 "unlock_type": "points",  "unlock_value": 600,  "emoji": "🏯"},
    {"key": "emoji_moon",       "name": "🌙 Luna",           "type": "emoji",  "description": "La oscuridad del shinobi",          "unlock_type": "points",  "unlock_value": 700,  "emoji": "🌙"},
    {"key": "emoji_gem",        "name": "💎 Cristal",        "type": "emoji",  "description": "Raro y valioso",                    "unlock_type": "points",  "unlock_value": 800,  "emoji": "💎"},
    {"key": "emoji_dragon",     "name": "🐉 Dragón",         "type": "emoji",  "description": "Poder legendario",                  "unlock_type": "points",  "unlock_value": 1000, "emoji": "🐉"},
    {"key": "emoji_fire",       "name": "🔥 Llama",          "type": "emoji",  "description": "Ardiente como tu pasión por el anime","unlock_type": "points", "unlock_value": 1200, "emoji": "🔥"},
    {"key": "emoji_thunder",    "name": "⚡ Rayo",           "type": "emoji",  "description": "La velocidad del relámpago",        "unlock_type": "points",  "unlock_value": 1500, "emoji": "⚡"},
    {"key": "emoji_hibiscus",   "name": "🌺 Hibisco",        "type": "emoji",  "description": "Flor de los campeones",             "unlock_type": "points",  "unlock_value": 1800, "emoji": "🌺"},
    {"key": "emoji_butterfly",  "name": "🦋 Mariposa",       "type": "emoji",  "description": "Transformación espiritual",         "unlock_type": "points",  "unlock_value": 2000, "emoji": "🦋"},
    {"key": "emoji_skull",      "name": "💀 Calavera",       "type": "emoji",  "description": "Para los verdaderos oscuros",       "unlock_type": "points",  "unlock_value": 2200, "emoji": "💀"},
    {"key": "emoji_hanafuda",   "name": "🎴 Hanafuda",       "type": "emoji",  "description": "Tradición japonesa",                "unlock_type": "points",  "unlock_value": 2400, "emoji": "🎴"},
    {"key": "emoji_sharingan",  "name": "Sharingan",          "type": "emoji",  "description": "Solo para los más devotos",         "unlock_type": "points",  "unlock_value": 2500, "image": "/sharingan.svg"},
    {"key": "emoji_oni",        "name": "👹 Oni",            "type": "emoji",  "description": "El demonio ancestral",              "unlock_type": "points",  "unlock_value": 3000, "emoji": "👹"},
    {"key": "emoji_nazar",      "name": "🧿 Ojo Protector",  "type": "emoji",  "description": "El mal de ojo apartado",            "unlock_type": "points",  "unlock_value": 3500, "emoji": "🧿"},
    {"key": "emoji_trident",    "name": "🔱 Tridente",       "type": "emoji",  "description": "Poder de los dioses",               "unlock_type": "points",  "unlock_value": 4000, "emoji": "🔱"},
    {"key": "emoji_lotus",      "name": "🪷 Loto",           "type": "emoji",  "description": "Pureza y renacimiento",             "unlock_type": "points",  "unlock_value": 5000, "emoji": "🪷"},
    {"key": "emoji_crown",      "name": "👑 Corona",         "type": "emoji",  "description": "El rey del anime",                  "unlock_type": "points",  "unlock_value": 7500, "emoji": "👑"},
]

# ─── Level / rank helpers ──────────────────────────────────────────────────────

def get_user_rank(level: int) -> str:
    if level >= 50: return "The Guardian"
    if level >= 30: return "Leyenda"
    if level >= 20: return "Héroe Anime"
    if level >= 15: return "Guerrero Otaku"
    if level >= 10: return "Explorador Otaku"
    if level >= 5:  return "Aventurero"
    return "Novato"

def get_level_threshold(level: int) -> int:
    """Accumulated points required to reach `level` from 0.
    Triangular formula: L1=0, L2=100, L3=300, L4=600, ..."""
    return 100 * (level - 1) * level // 2

def calculate_level(points: int) -> int:
    level = 1
    while get_level_threshold(level + 1) <= points:
        level += 1
    return level

# ─── Firestore helpers ─────────────────────────────────────────────────────────

def next_user_id() -> int:
    """Atomically increment and return the new user_count."""
    ref = db.collection("_meta").document("counters")
    ref.update({"user_count": fs.Increment(1)})
    snap = ref.get()
    return snap.to_dict().get("user_count", 1)

def get_user(username: str) -> dict | None:
    """Return the user document dict or None."""
    if not username:
        return None
    snap = db.collection("users").document(username).get()
    if not snap.exists:
        return None
    d = snap.to_dict()
    d["_id"] = snap.id  # convenience alias
    return d

def save_user(username: str, data: dict):
    db.collection("users").document(username).set(data, merge=True)

def _build_user_profile(user: dict, is_following: bool = False, current_username: str | None = None) -> dict:
    """Build the UserProfile-compatible dict from a Firestore user doc."""
    level = user.get("level", 1)
    badge_keys = user.get("badge_keys", [])
    badges = [{"name": k} for k in badge_keys]

    following_list: list[str] = user.get("following", [])
    # followers = count of all users who have this username in their 'following' list
    followers_docs = db.collection("users").where(
        filter=FieldFilter("following", "array_contains", user["username"])
    ).get()
    followers_count = len(followers_docs)

    return {
        "id": user.get("id", 0),
        "username": user["username"],
        "points": user.get("points", 0),
        "level": level,
        "badges": badges,
        "followers_count": followers_count,
        "following_count": len(following_list),
        "is_following": is_following,
        "avatar_url": user.get("avatar_url"),
        "banner_url": user.get("banner_url"),
        "bio": user.get("bio"),
        "location": user.get("location"),
        "rank": get_user_rank(level),
        "next_level_points": get_level_threshold(level + 1),
        "level_start_points": get_level_threshold(level),
        "spoilers_safe": user.get("spoilers_safe", 0),
        "active_frame": user.get("active_frame"),
        "active_emoji": user.get("active_emoji"),
        "active_banner": user.get("active_banner"),
        "is_premium": bool(user.get("is_premium", False)),
        "is_admin": bool(user.get("is_admin", False)),
        "is_banned": bool(user.get("is_banned", False)),
    }

def _get_user_stats_fs(username: str) -> dict:
    """Collect all gamification stats for a user from Firestore."""
    # Episodes watched
    anime_docs = db.collection("user_progress").document(username).collection("anime").get()
    episodes = sum(len(doc.to_dict().get("watched", [])) for doc in anime_docs)

    # Manga chapters
    manga_docs = db.collection("user_progress").document(username).collection("manga").get()
    manga_chapters = sum(len(doc.to_dict().get("read", [])) for doc in manga_docs)

    # Comments
    comments_docs = db.collection("comments").where(
        filter=FieldFilter("username", "==", username)
    ).get()
    comments = len(comments_docs)

    # Recommendations
    recs_docs = db.collection("recommendations").where(
        filter=FieldFilter("username", "==", username)
    ).get()
    recommendations = len(recs_docs)

    # Games (distinct game_ids)
    game_docs = db.collection("game_sessions").where(
        filter=FieldFilter("username", "==", username)
    ).get()
    unique_games = {d.to_dict().get("game_id") for d in game_docs}
    games = len(unique_games)

    # Following / followers
    user = get_user(username)
    following = len(user.get("following", [])) if user else 0
    followers_docs = db.collection("users").where(
        filter=FieldFilter("following", "array_contains", username)
    ).get()
    followers = len(followers_docs)

    spoilers_safe = user.get("spoilers_safe", 0) if user else 0
    level = user.get("level", 1) if user else 1

    return {
        "episodes": episodes,
        "manga_chapters": manga_chapters,
        "games": games,
        "recommendations": recommendations,
        "comments": comments,
        "following": following,
        "followers": followers,
        "spoilers_safe": spoilers_safe,
        "level": level,
    }

def check_and_award_achievements_fs(username: str) -> list[str]:
    """Check and grant achievements. Returns names of newly earned ones."""
    user = get_user(username)
    if not user:
        return []
    stats = _get_user_stats_fs(username)
    badge_keys: list[str] = user.get("badge_keys", [])
    newly_earned: list[str] = []
    bonus_pts = 0

    for ach in ACHIEVEMENTS_CATALOG:
        current = stats.get(ach["stat"], 0)
        if current < ach["requirement"]:
            continue
        if ach["key"] not in badge_keys:
            badge_keys.append(ach["key"])
            bonus_pts += ach["bonus_points"]
            newly_earned.append(ach["name"])

    if newly_earned:
        new_points = user.get("points", 0) + bonus_pts
        new_level = calculate_level(new_points)
        save_user(username, {
            "badge_keys": badge_keys,
            "points": new_points,
            "level": new_level,
        })

    return newly_earned

def update_user_points(username: str, delta: int):
    """Add delta points and recalculate level."""
    user = get_user(username)
    if not user:
        return
    new_points = user.get("points", 0) + delta
    new_level = calculate_level(new_points)
    save_user(username, {"points": new_points, "level": new_level})

# ─── Auth helpers ──────────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    username = payload.get("sub")
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def require_admin(user: dict):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Acceso denegado: se requieren permisos de administrador")

# ─── AniList URL ───────────────────────────────────────────────────────────────
ANILIST_URL = os.getenv("ANILIST_API_URL", "https://graphql.anilist.co")

# ─── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Backend operativo"}

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/register")
def register(user: UserCreate):
    if get_user(user.username):
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    uid = next_user_id()
    hashed_pw = auth.get_password_hash(user.password)
    doc = {
        "id": uid,
        "username": user.username,
        "password": hashed_pw,
        "points": 0,
        "level": 1,
        "is_premium": False,
        "is_admin": False,
        "is_banned": False,
        "avatar_url": None,
        "banner_url": None,
        "bio": None,
        "location": None,
        "spoilers_safe": 0,
        "active_frame": None,
        "active_emoji": None,
        "active_banner": None,
        "badge_keys": [],
        "following": [],
        "liked_comments": [],
    }
    db.collection("users").document(user.username).set(doc)
    token = auth.create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not auth.verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Login fallido")
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Tu cuenta ha sido suspendida por un administrador.")
    token = auth.create_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

# ═══════════════════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/users/me/profile")
def get_my_profile(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404)
    return _build_user_profile(user, is_following=False)

@app.put("/users/me/profile")
def update_my_profile(update_data: UserUpdate, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404)
    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    if updates:
        save_user(user["username"], updates)
    return {"msg": "Perfil actualizado exitosamente"}

@app.get("/users/me/progress")
def get_my_progress(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404)
    username = user["username"]
    anime_docs = db.collection("user_progress").document(username).collection("anime").get()
    result = []
    for doc in anime_docs:
        d = doc.to_dict()
        for ep in d.get("watched", []):
            result.append({
                "anime_id": int(doc.id),
                "episode_number": ep,
                "is_watched": 1,
            })
    return result

@app.get("/users/me/stats")
def get_my_stats(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404)
    stats = _get_user_stats_fs(user["username"])
    return {
        "episodes_watched": stats["episodes"],
        "manga_chapters": stats["manga_chapters"],
        "comments": stats["comments"],
        "recommendations": stats["recommendations"],
        "games_played": stats["games"],
        "spoilers_safe": stats["spoilers_safe"],
    }

@app.get("/users/search")
def search_users(query: str = ""):
    if len(query) < 2:
        return []
    all_users = db.collection("users").get()
    results = []
    q_lower = query.lower()
    for doc in all_users:
        u = doc.to_dict()
        if u.get("is_banned"):
            continue
        if q_lower in u.get("username", "").lower():
            results.append({
                "id": u.get("id", 0),
                "username": u["username"],
                "avatar_url": u.get("avatar_url"),
                "level": u.get("level", 1),
                "is_premium": bool(u.get("is_premium", False)),
            })
        if len(results) >= 10:
            break
    return results

@app.get("/users/{username}")
def get_public_profile(username: str, token: str = Depends(oauth2_scheme)):
    target = get_user(username)
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    is_following = False
    try:
        if token:
            payload = auth.decode_token(token)
            me = get_user(payload.get("sub"))
            if me and username in me.get("following", []):
                is_following = True
    except Exception:
        pass

    return _build_user_profile(target, is_following=is_following)

@app.post("/users/{user_id}/follow")
def follow_user(user_id: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    me = get_user(payload.get("sub"))
    if not me:
        raise HTTPException(status_code=401)

    # Find target by numeric id
    all_users = db.collection("users").where(filter=FieldFilter("id", "==", user_id)).get()
    if not all_users:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    target_doc = all_users[0]
    target = target_doc.to_dict()
    target["username"] = target_doc.id

    if me["id"] == user_id:
        raise HTTPException(status_code=400, detail="No te puedes seguir a ti mismo")

    my_following: list[str] = me.get("following", [])
    if target["username"] not in my_following:
        my_following.append(target["username"])
        save_user(me["username"], {"following": my_following})
        update_user_points(me["username"], 2)
        check_and_award_achievements_fs(me["username"])

    return {"msg": f"Ahora sigues a {target['username']}"}

@app.post("/users/me/upgrade")
def upgrade_to_premium(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404)
    if user.get("is_premium"):
        return {"msg": "El usuario ya es Premium", "success": True}
    save_user(user["username"], {"is_premium": True})
    return {"msg": "¡Bienvenido a SpoilerSafe Premium! Se ha actualizado tu cuenta.", "success": True}

@app.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes (JPEG, PNG, GIF, WebP)")
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    url = f"http://localhost:8000/uploads/{filename}"
    return {"url": url}

# keep old upload endpoint path too
@app.post("/users/me/upload_image")
async def upload_user_image(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    return await upload_avatar(file=file, token=token)

# ═══════════════════════════════════════════════════════════════════════════════
# ACHIEVEMENTS & REWARDS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/achievements")
def get_achievements(token: str = Depends(oauth2_scheme)):
    stats: dict = {}
    earned_keys: set[str] = set()
    if token:
        try:
            payload = auth.decode_token(token)
            user = get_user(payload.get("sub"))
            if user:
                stats = _get_user_stats_fs(user["username"])
                earned_keys = set(user.get("badge_keys", []))
        except Exception:
            pass

    result = []
    for ach in ACHIEVEMENTS_CATALOG:
        current = stats.get(ach["stat"], 0) if stats else 0
        result.append({
            "key": ach["key"],
            "name": ach["name"],
            "description": ach["description"],
            "icon": ach["icon"],
            "category": ach["category"],
            "requirement": ach["requirement"],
            "bonus_points": ach["bonus_points"],
            "current_progress": min(current, ach["requirement"]),
            "is_earned": ach["key"] in earned_keys,
        })
    return result

@app.get("/rewards")
def get_rewards(token: str = Depends(oauth2_scheme)):
    user = None
    if token:
        try:
            payload = auth.decode_token(token)
            user = get_user(payload.get("sub"))
        except Exception:
            pass

    user_points = user.get("points", 0) if user else 0
    user_level  = user.get("level", 1) if user else 1
    active_frame  = user.get("active_frame")  if user else None
    active_emoji  = user.get("active_emoji")  if user else None
    active_banner = user.get("active_banner") if user else None

    result = []
    for r in REWARDS_CATALOG:
        if r["unlock_type"] == "default":
            unlocked = True
        elif r["unlock_type"] == "level":
            unlocked = user_level >= r["unlock_value"]
        elif r["unlock_type"] == "points":
            unlocked = user_points >= r["unlock_value"]
        else:
            unlocked = False

        entry = dict(r)
        entry["is_unlocked"] = unlocked
        entry["is_equipped"] = (
            (r["type"] == "frame"  and active_frame  == r["key"]) or
            (r["type"] == "emoji"  and active_emoji  == r["key"]) or
            (r["type"] == "banner" and active_banner == r["key"])
        )
        result.append(entry)
    return result

@app.put("/users/me/equip")
def equip_reward(data: EquipRequest, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    updates: dict = {}

    if data.active_frame is not None:
        reward = next((r for r in REWARDS_CATALOG if r["key"] == data.active_frame and r["type"] == "frame"), None)
        if not reward:
            raise HTTPException(400, "Marco no válido")
        if reward["unlock_type"] == "level" and user.get("level", 1) < reward["unlock_value"]:
            raise HTTPException(403, f"Necesitas nivel {reward['unlock_value']} para este marco")
        if reward["unlock_type"] == "points" and user.get("points", 0) < reward["unlock_value"]:
            raise HTTPException(403, f"Necesitas {reward['unlock_value']} puntos para este marco")
        updates["active_frame"] = data.active_frame

    if data.active_emoji is not None:
        reward = next((r for r in REWARDS_CATALOG if r["key"] == data.active_emoji and r["type"] == "emoji"), None)
        if not reward:
            raise HTTPException(400, "Emoji no válido")
        if reward["unlock_type"] == "points" and user.get("points", 0) < reward["unlock_value"]:
            raise HTTPException(403, f"Necesitas {reward['unlock_value']} puntos para este emoji")
        updates["active_emoji"] = data.active_emoji

    if data.active_banner is not None:
        reward = next((r for r in REWARDS_CATALOG if r["key"] == data.active_banner and r["type"] == "banner"), None)
        if not reward:
            raise HTTPException(400, "Banner no válido")
        if reward["unlock_type"] == "points" and user.get("points", 0) < reward["unlock_value"]:
            raise HTTPException(403, f"Necesitas {reward['unlock_value']} puntos para este banner")
        updates["active_banner"] = data.active_banner
        updates["banner_url"] = reward.get("image", "")

    if updates:
        save_user(user["username"], updates)
    return {"msg": "Equipamiento actualizado"}

# ═══════════════════════════════════════════════════════════════════════════════
# ANIME (AniList proxy)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/anime/trending")
def get_trending_anime():
    query_graphql = """
    query {
      Page(page: 1, perPage: 12) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          title { romaji }
          coverImage { extraLarge large }
          format
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql})
    return response.json()

@app.get("/anime/search")
def search_anime(query: str):
    query_graphql = """
    query ($search: String) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: ANIME) {
          id
          title { romaji }
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": {"search": query}})
    return response.json()

@app.get("/anime/catalog")
def get_anime_catalog(page: int = 1, sort: str = "TRENDING_DESC", search: str = None):
    query_args = "$page: Int, $sort: [MediaSort]"
    media_args = "type: ANIME, sort: $sort"
    variables: dict = {"page": page, "sort": [sort]}

    if search and search.strip():
        variables["search"] = search.strip()
        media_args += ", search: $search"
        query_args += ", $search: String"

    if sort in ["EPISODES", "EPISODES_DESC"]:
        variables["episodesGreater"] = 0
        media_args += ", episodes_greater: $episodesGreater"
        query_args += ", $episodesGreater: Int"
    elif sort in ["DURATION", "DURATION_DESC"]:
        variables["durationGreater"] = 0
        media_args += ", duration_greater: $durationGreater"
        query_args += ", $durationGreater: Int"

    query_graphql = f"""
    query ({query_args}) {{
      Page(page: $page, perPage: 20) {{
        pageInfo {{ total perPage currentPage lastPage hasNextPage }}
        media({media_args}) {{
          id
          title {{ romaji english }}
          coverImage {{ extraLarge large }}
          averageScore
          seasonYear
          format
          isAdult
        }}
      }}
    }}
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": variables})
    return response.json()

@app.get("/anime/new-releases")
def get_new_releases(page: int = 1):
    now = datetime.now()
    year = now.year
    month = now.month
    if month <= 3:
        season = "WINTER"
    elif month <= 6:
        season = "SPRING"
    elif month <= 9:
        season = "SUMMER"
    else:
        season = "FALL"

    query_graphql = """
    query ($page: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: START_DATE_DESC, status_in: [RELEASING, NOT_YET_RELEASED, FINISHED]) {
          id
          title { romaji english }
          coverImage { extraLarge large }
          bannerImage
          genres
          averageScore
          episodes
          status
          format
          startDate { year month day }
          description
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={
        "query": query_graphql,
        "variables": {"page": page, "season": season, "seasonYear": year},
    })
    return response.json()

@app.get("/anime/{id}")
def get_anime_details(id: int):
    query_graphql = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        description
        bannerImage
        coverImage { large extraLarge }
        episodes
        genres
        averageScore
        season
        seasonYear
        status
        nextAiringEpisode { episode airingAt }
        streamingEpisodes { title thumbnail url site }
        externalLinks { url site icon language }
        trailer { id site }
        isAdult
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": {"id": id}})
    return response.json()

# ─── Time capsules ─────────────────────────────────────────────────────────────

@app.post("/anime/capsule")
def bury_capsule(capsule: TimeCapsuleCreate, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401)

    db.collection("time_capsules").add({
        "user_id": user["id"],
        "username": user["username"],
        "anime_id": capsule.anime_id,
        "episode_number": 1,
        "unlock_episode": capsule.unlock_episode,
        "content": capsule.content,
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"msg": "Cápsula enterrada. Se desbloqueará en el episodio " + str(capsule.unlock_episode)}

@app.get("/anime/{anime_id}/capsules")
def get_capsules(anime_id: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401)

    username = user["username"]

    # Get max watched episode for this anime
    progress_snap = db.collection("user_progress").document(username).collection("anime").document(str(anime_id)).get()
    watched: list[int] = []
    if progress_snap.exists:
        watched = progress_snap.to_dict().get("watched", [])
    max_ep = max(watched) if watched else 0

    caps_docs = db.collection("time_capsules").where(
        filter=FieldFilter("username", "==", username)
    ).where(
        filter=FieldFilter("anime_id", "==", anime_id)
    ).get()

    results = []
    for doc in caps_docs:
        c = doc.to_dict()
        unlock_at = c.get("unlock_episode", 0)
        if max_ep >= unlock_at:
            results.append({"content": c.get("content"), "locked": False, "unlock_at": unlock_at})
        else:
            results.append({"content": "CONTENIDO BLOQUEADO", "locked": True, "unlock_at": unlock_at})
    return results

# ─── Episode comments ──────────────────────────────────────────────────────────

@app.get("/anime/{anime_id}/episodes/{episode_number}/comments")
def get_comments(anime_id: int, episode_number: int, token: str = Depends(oauth2_scheme)):
    current_username = None
    try:
        if token:
            payload = auth.decode_token(token)
            current_username = payload.get("sub")
    except Exception:
        pass

    docs = db.collection("comments").where(
        filter=FieldFilter("anime_id", "==", anime_id)
    ).where(
        filter=FieldFilter("episode_number", "==", episode_number)
    ).get()

    results = []
    for doc in docs:
        c = doc.to_dict()
        liked_by: list[str] = c.get("liked_by", [])
        results.append({
            "id": doc.id,
            "user_id": c.get("user_id"),
            "username": c.get("username"),
            "content": c.get("content"),
            "timestamp": c.get("timestamp", 0),
            "created_at": c.get("created_at"),
            "is_spoiler": c.get("is_spoiler", 0),
            "likes_count": len(liked_by),
            "is_liked": current_username in liked_by if current_username else False,
        })
    return results

@app.post("/anime/{anime_id}/episodes/{episode_number}/comments")
def create_comment(
    anime_id: int,
    episode_number: int,
    comment: CommentCreate,
    token: str = Depends(oauth2_scheme),
):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    db.collection("comments").add({
        "user_id": user["id"],
        "username": user["username"],
        "anime_id": anime_id,
        "episode_number": episode_number,
        "content": comment.content,
        "is_spoiler": 0,
        "created_at": datetime.utcnow().isoformat(),
        "timestamp": comment.timestamp,
        "liked_by": [],
    })
    update_user_points(user["username"], 5)
    check_and_award_achievements_fs(user["username"])
    return {"msg": "Comentario añadido (+5 puntos)"}

@app.post("/comments/{comment_id}/like")
def like_comment(comment_id: str, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401)

    ref = db.collection("comments").document(comment_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404)

    c = snap.to_dict()
    liked_by: list[str] = c.get("liked_by", [])
    username = user["username"]

    if username in liked_by:
        liked_by.remove(username)
        msg = "Like quitado"
    else:
        liked_by.append(username)
        msg = "Like añadido"
        # Award points to comment author (not self)
        author_username = c.get("username")
        if author_username and author_username != username:
            update_user_points(author_username, 2)

    ref.update({"liked_by": liked_by})
    return {"msg": msg, "likes_count": len(liked_by)}

@app.post("/comments/{comment_id}/report")
def report_spoiler(comment_id: str, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401)

    ref = db.collection("comments").document(comment_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404)

    # Mark comment as spoiler
    ref.update({"is_spoiler": 1})

    # Add report
    db.collection("spoiler_reports").add({
        "reporter_id": user["id"],
        "reporter_username": user["username"],
        "comment_id": comment_id,
        "status": "confirmed",
        "created_at": datetime.utcnow().isoformat(),
    })

    username = user["username"]
    current = get_user(username)
    new_ss = current.get("spoilers_safe", 0) + 1
    save_user(username, {"spoilers_safe": new_ss})
    update_user_points(username, 10)
    check_and_award_achievements_fs(username)
    updated = get_user(username)
    return {"msg": f"Reporte procesado. +10 puntos de Guardian. Spoilers safe: {updated.get('spoilers_safe', new_ss)}"}

# ─── Anime progress ────────────────────────────────────────────────────────────

@app.post("/anime/{anime_id}/episodes/{episode_number}/watched")
def mark_watched(anime_id: int, episode_number: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401)

    username = user["username"]
    ref = db.collection("user_progress").document(username).collection("anime").document(str(anime_id))
    snap = ref.get()
    watched: list[int] = snap.to_dict().get("watched", []) if snap.exists else []

    if episode_number in watched:
        return {"msg": "Ya marcado como visto", "points_earned": 0}

    watched.append(episode_number)
    ref.set({"watched": watched}, merge=True)
    update_user_points(username, 3)
    check_and_award_achievements_fs(username)
    return {"msg": "Marcado como visto", "points_earned": 3}

@app.get("/anime/{anime_id}/progress")
def get_anime_progress(anime_id: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    snap = db.collection("user_progress").document(user["username"]).collection("anime").document(str(anime_id)).get()
    watched: list[int] = snap.to_dict().get("watched", []) if snap.exists else []
    return {"watched_episodes": watched}

# ═══════════════════════════════════════════════════════════════════════════════
# MANGA (AniList proxy)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/manga/search")
def search_manga(q: str = ""):
    query_graphql = """
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: MANGA) {
          id
          title { romaji english }
          coverImage { extraLarge large }
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": {"search": q}})
    return response.json()

@app.get("/manga/trending")
def get_trending_manga():
    query_graphql = """
    query {
      Page(page: 1, perPage: 12) {
        media(sort: POPULARITY_DESC, type: MANGA) {
          id
          title { romaji }
          coverImage { extraLarge large }
          format
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql})
    return response.json()

@app.get("/manga/catalog")
def get_manga_catalog(page: int = 1, sort: str = "TRENDING_DESC", search: str = None):
    query_args = "$page: Int, $sort: [MediaSort]"
    media_args = "type: MANGA, sort: $sort"
    variables: dict = {"page": page, "sort": [sort]}

    if search and search.strip():
        variables["search"] = search.strip()
        media_args += ", search: $search"
        query_args += ", $search: String"

    query_graphql = f"""
    query ({query_args}) {{
      Page(page: $page, perPage: 20) {{
        pageInfo {{ total perPage currentPage lastPage hasNextPage }}
        media({media_args}) {{
          id
          title {{ romaji english }}
          coverImage {{ extraLarge large }}
          averageScore
          format
          isAdult
        }}
      }}
    }}
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": variables})
    return response.json()

@app.get("/manga/{manga_id}")
def get_manga_details(manga_id: int):
    query_graphql = """
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title { romaji english native }
        description
        chapters
        volumes
        status
        genres
        averageScore
        popularity
        coverImage { extraLarge large }
        bannerImage
        externalLinks { url site }
        startDate { year month day }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": {"id": manga_id}})
    return response.json()

@app.post("/manga/{manga_id}/chapters/{chapter_number}/read")
def mark_manga_chapter_read(manga_id: int, chapter_number: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    username = user["username"]
    ref = db.collection("user_progress").document(username).collection("manga").document(str(manga_id))
    snap = ref.get()
    read_chapters: list[int] = snap.to_dict().get("read", []) if snap.exists else []

    if chapter_number in read_chapters:
        return {"msg": "Ya marcado como leído", "points_earned": 0}

    read_chapters.append(chapter_number)
    ref.set({"read": read_chapters}, merge=True)
    update_user_points(username, 2)
    check_and_award_achievements_fs(username)
    return {"msg": f"Capítulo {chapter_number} marcado como leído (+2 puntos)", "points_earned": 2}

@app.get("/manga/{manga_id}/progress")
def get_manga_progress(manga_id: int, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    snap = db.collection("user_progress").document(user["username"]).collection("manga").document(str(manga_id)).get()
    read_chapters: list[int] = snap.to_dict().get("read", []) if snap.exists else []
    return {"read_chapters": read_chapters}

# ═══════════════════════════════════════════════════════════════════════════════
# WATCHLIST
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/watchlist")
def get_watchlist(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    items_docs = db.collection("watchlist").document(username).collection("items").get()
    anime_ids = []
    items_by_id: dict[int, dict] = {}
    for doc in items_docs:
        d = doc.to_dict()
        aid = d.get("anime_id")
        if aid:
            anime_ids.append(aid)
            items_by_id[aid] = d

    if not anime_ids:
        return []

    query_graphql = """
    query ($ids: [Int]) {
      Page(perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          genres
          averageScore
          episodes
          status
          isAdult
        }
      }
    }
    """
    response = requests.post(ANILIST_URL, json={"query": query_graphql, "variables": {"ids": anime_ids}})
    data = response.json()
    media_list = data.get("data", {}).get("Page", {}).get("media", [])

    media_map = {m["id"]: m for m in media_list}
    result = []
    for aid in anime_ids:
        if aid in media_map:
            entry = media_map[aid]
            entry["added_at"] = items_by_id[aid].get("added_at")
            result.append(entry)
    return result

@app.post("/watchlist")
def add_to_watchlist(data: dict, current_user: dict = Depends(get_current_user)):
    anime_id = data.get("anime_id")
    if not anime_id:
        raise HTTPException(400, "anime_id requerido")

    username = current_user["username"]
    ref = db.collection("watchlist").document(username).collection("items").document(str(anime_id))
    if ref.get().exists:
        raise HTTPException(409, "Ya está en tu watchlist")

    ref.set({"anime_id": anime_id, "added_at": datetime.utcnow().isoformat()})
    return {"msg": "Añadido a tu watchlist"}

@app.delete("/watchlist/{anime_id}")
def remove_from_watchlist(anime_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    ref = db.collection("watchlist").document(username).collection("items").document(str(anime_id))
    if not ref.get().exists:
        raise HTTPException(404, "No está en tu watchlist")
    ref.delete()
    return {"msg": "Eliminado de tu watchlist"}

@app.get("/watchlist/check/{anime_id}")
def check_watchlist(anime_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    ref = db.collection("watchlist").document(username).collection("items").document(str(anime_id))
    return {"in_watchlist": ref.get().exists}

# ═══════════════════════════════════════════════════════════════════════════════
# FAVORITES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/favorites")
def get_favorites(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    docs = db.collection("favorites").document(username).collection("items").get()
    result = []
    for doc in docs:
        f = doc.to_dict()
        result.append({
            "id": f.get("media_id"),
            "media_type": f.get("media_type"),
            "title": {"romaji": f.get("title"), "english": f.get("title")},
            "coverImage": {"large": f.get("cover_image"), "extraLarge": f.get("cover_image")},
            "bannerImage": f.get("banner_image"),
            "genres": f.get("genres", "").split(",") if f.get("genres") else [],
            "averageScore": f.get("average_score"),
        })
    return result

@app.post("/favorites")
def add_favorite(data: dict, current_user: dict = Depends(get_current_user)):
    media_id = data.get("media_id")
    media_type = data.get("media_type", "anime")
    if not media_id:
        raise HTTPException(400, "media_id required")

    username = current_user["username"]
    key = f"{media_id}_{media_type}"
    ref = db.collection("favorites").document(username).collection("items").document(key)
    if ref.get().exists:
        raise HTTPException(409, "Ya está en favoritos")

    ref.set({
        "media_id": media_id,
        "media_type": media_type,
        "title": data.get("title", ""),
        "cover_image": data.get("cover_image"),
        "banner_image": data.get("banner_image"),
        "genres": ",".join(data.get("genres", [])),
        "average_score": data.get("average_score"),
        "added_at": datetime.utcnow().isoformat(),
    })
    return {"msg": "Añadido a favoritos"}

@app.delete("/favorites/{media_type}/{media_id}")
def remove_favorite(media_type: str, media_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    key = f"{media_id}_{media_type}"
    ref = db.collection("favorites").document(username).collection("items").document(key)
    if not ref.get().exists:
        raise HTTPException(404, "No está en favoritos")
    ref.delete()
    return {"msg": "Eliminado de favoritos"}

@app.get("/favorites/check/{media_type}/{media_id}")
def check_favorite(media_type: str, media_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    key = f"{media_id}_{media_type}"
    ref = db.collection("favorites").document(username).collection("items").document(key)
    return {"is_favorite": ref.get().exists}

# ═══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/recommendations")
def list_recommendations(media_type: str = None, token: str = Depends(oauth2_scheme)):
    me_username = None
    if token:
        try:
            payload = auth.decode_token(token)
            me_username = payload.get("sub")
        except Exception:
            pass

    query = db.collection("recommendations").order_by("created_at", direction=fs.Query.DESCENDING).limit(50)
    docs = query.get()

    result = []
    for doc in docs:
        r = doc.to_dict()
        if media_type and r.get("media_type") != media_type:
            continue
        liked_by: list[str] = r.get("liked_by", [])
        result.append({
            "id": doc.id,
            "media_id": r.get("media_id"),
            "media_type": r.get("media_type"),
            "title": r.get("title"),
            "cover_image": r.get("cover_image"),
            "reason": r.get("reason"),
            "created_at": r.get("created_at"),
            "author": r.get("username", "?"),
            "author_avatar": _get_author_avatar(r.get("username")),
            "likes": len(liked_by),
            "is_liked": me_username in liked_by if me_username else False,
            "is_mine": r.get("username") == me_username,
        })
    return result

def _get_author_avatar(username: str | None) -> str | None:
    if not username:
        return None
    u = get_user(username)
    return u.get("avatar_url") if u else None

@app.post("/recommendations")
def create_recommendation(data: RecommendationCreate, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)
    if user.get("level", 1) < 5:
        raise HTTPException(403, "Necesitas nivel 5 para hacer recomendaciones")

    _, ref = db.collection("recommendations").add({
        "user_id": user["id"],
        "username": user["username"],
        "media_id": data.media_id,
        "media_type": data.media_type,
        "title": data.title,
        "cover_image": data.cover_image,
        "reason": data.reason,
        "created_at": datetime.utcnow().strftime("%d %b %Y"),
        "liked_by": [],
    })
    update_user_points(user["username"], 15)
    check_and_award_achievements_fs(user["username"])
    return {"msg": "Recomendación publicada (+15 puntos)", "id": ref.id}

@app.post("/recommendations/{rec_id}/like")
def like_recommendation(rec_id: str, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    ref = db.collection("recommendations").document(rec_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(404, "Recomendación no encontrada")

    r = snap.to_dict()
    liked_by: list[str] = r.get("liked_by", [])
    username = user["username"]

    if username in liked_by:
        liked_by.remove(username)
        ref.update({"liked_by": liked_by})
        return {"msg": "Like eliminado", "liked": False}

    liked_by.append(username)
    ref.update({"liked_by": liked_by})

    author_username = r.get("username")
    if author_username and author_username != username:
        update_user_points(author_username, 5)
        check_and_award_achievements_fs(author_username)

    return {"msg": "Like añadido (+5 al autor)", "liked": True}

# ═══════════════════════════════════════════════════════════════════════════════
# GAMES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/games")
def get_games():
    url = "https://www.freetogame.com/api/games?category=anime"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code == 200:
            return response.json()
        url_fallback = "https://www.freetogame.com/api/games?sort-by=popularity"
        response = requests.get(url_fallback, headers={"User-Agent": "Mozilla/5.0"})
        return response.json()[:30]
    except Exception as e:
        print("Error fetching games:", e)
        return []

@app.post("/games/session")
def log_game_session(data: dict, token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, "Token requerido")
    payload = auth.decode_token(token)
    user = get_user(payload.get("sub"))
    if not user:
        raise HTTPException(404)

    game_id = str(data.get("game_id", ""))
    game_title = data.get("game_title", "")
    if not game_id:
        raise HTTPException(400, "game_id requerido")

    username = user["username"]
    today_str = date.today().isoformat()

    # Check if already played today
    existing = db.collection("game_sessions").where(
        filter=FieldFilter("username", "==", username)
    ).where(
        filter=FieldFilter("game_id", "==", game_id)
    ).where(
        filter=FieldFilter("played_at", ">=", today_str)
    ).limit(1).get()

    if existing:
        return {"msg": "Ya ganaste puntos por este juego hoy", "points_earned": 0}

    db.collection("game_sessions").add({
        "user_id": user["id"],
        "username": username,
        "game_id": game_id,
        "game_title": game_title,
        "played_at": datetime.utcnow().isoformat(),
    })
    update_user_points(username, 10)
    check_and_award_achievements_fs(username)
    return {"msg": f"¡+10 puntos por jugar {game_title}!", "points_earned": 10}

# ═══════════════════════════════════════════════════════════════════════════════
# NEWS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/news")
def get_news():
    url = "https://www.animenewsnetwork.com/news/rss.xml"
    try:
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"},
            timeout=10,
        )
        root = ET.fromstring(response.content)
        news_list = []
        for i, item in enumerate(root.findall(".//item")):
            if i >= 24:
                break
            title       = item.find("title").text       if item.find("title")       is not None else ""
            link        = item.find("link").text         if item.find("link")         is not None else ""
            description = item.find("description").text  if item.find("description")  is not None else ""
            pub_date    = item.find("pubDate").text      if item.find("pubDate")      is not None else ""
            category    = item.find("category").text     if item.find("category")     is not None else "Anime"

            image_url = None
            image_match = re.search(r'src="(.*?)"', description)
            if image_match:
                image_url = image_match.group(1)

            if not image_url and link:
                try:
                    page_res = requests.get(
                        link,
                        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"},
                        timeout=5,
                    )
                    og_match = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', page_res.text)
                    if og_match:
                        image_url = og_match.group(1)
                except Exception:
                    pass

            if not image_url:
                image_url = ""

            summary = re.sub(r"<[^>]+>", "", description).strip()
            date_parts = pub_date.split()
            formatted_date = f"{date_parts[1]} {date_parts[2]} {date_parts[3]}" if len(date_parts) >= 4 else pub_date

            news_list.append({
                "id": str(i),
                "title": title,
                "summary": summary[:150] + "..." if len(summary) > 150 else summary,
                "image": image_url,
                "category": category,
                "date": formatted_date,
                "link": link,
                "readTime": "3 min",
            })
        return news_list
    except Exception as e:
        print("Error fetching news:", e)
        return []

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/admin/users")
def admin_list_users(current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    docs = db.collection("users").order_by("id").get()
    return [{
        "id": u.get("id", 0),
        "username": u.get("username"),
        "level": u.get("level", 1),
        "points": u.get("points", 0),
        "is_admin": bool(u.get("is_admin", False)),
        "is_banned": bool(u.get("is_banned", False)),
        "is_premium": bool(u.get("is_premium", False)),
        "avatar_url": u.get("avatar_url"),
    } for doc in docs for u in [doc.to_dict()]]

def _admin_find_user_by_id(user_id: int) -> tuple[str | None, dict | None]:
    """Return (username, user_dict) for a user with the given numeric id."""
    docs = db.collection("users").where(filter=FieldFilter("id", "==", user_id)).limit(1).get()
    if not docs:
        return None, None
    doc = docs[0]
    u = doc.to_dict()
    u["username"] = doc.id
    return doc.id, u

@app.post("/admin/users/{user_id}/ban")
def admin_ban_user(user_id: int, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    username, user = _admin_find_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.get("is_admin"):
        raise HTTPException(400, "No puedes banear a un administrador")
    save_user(username, {"is_banned": True})
    return {"msg": f"Usuario {username} baneado"}

@app.post("/admin/users/{user_id}/unban")
def admin_unban_user(user_id: int, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    username, user = _admin_find_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    save_user(username, {"is_banned": False})
    return {"msg": f"Usuario {username} desbaneado"}

@app.post("/admin/users/{user_id}/premium")
def admin_set_premium(user_id: int, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    username, user = _admin_find_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    save_user(username, {"is_premium": True})
    return {"msg": f"Usuario {username} marcado como premium"}

@app.get("/admin/reports")
def admin_list_reports(current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    docs = db.collection("spoiler_reports").get()
    return [{
        "id": doc.id,
        **doc.to_dict(),
    } for doc in docs]

@app.post("/admin/reports/{report_id}/resolve")
def admin_resolve_report(report_id: str, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    ref = db.collection("spoiler_reports").document(report_id)
    if not ref.get().exists:
        raise HTTPException(404, "Reporte no encontrado")
    ref.update({"status": "resolved"})
    return {"msg": "Reporte resuelto"}

@app.get("/admin/restricted")
def admin_list_restricted(current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    docs = db.collection("restricted_content").get()
    return [{
        "id": doc.id,
        **doc.to_dict(),
    } for doc in docs]

@app.post("/admin/restricted")
def admin_restrict_content(data: dict, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    _, ref = db.collection("restricted_content").add({
        "content_type": data.get("content_type", "anime"),
        "anilist_id": data.get("anilist_id"),
        "title": data.get("title", ""),
        "reason": data.get("reason", ""),
        "restricted_by": current_user["id"],
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"msg": "Contenido restringido", "id": ref.id}

@app.delete("/admin/restricted/{item_id}")
def admin_unrestrict_content(item_id: str, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    ref = db.collection("restricted_content").document(item_id)
    if not ref.get().exists:
        raise HTTPException(404, "No encontrado")
    ref.delete()
    return {"msg": "Contenido desbloqueado"}

# Keep old admin URL aliases for content restriction
@app.get("/admin/content/restricted")
def admin_list_restricted_alias(current_user: dict = Depends(get_current_user)):
    return admin_list_restricted(current_user)

@app.post("/admin/content/restrict")
def admin_restrict_content_alias(data: dict, current_user: dict = Depends(get_current_user)):
    return admin_restrict_content(data, current_user)

@app.delete("/admin/content/restrict/{item_id}")
def admin_unrestrict_content_alias(item_id: str, current_user: dict = Depends(get_current_user)):
    return admin_unrestrict_content(item_id, current_user)

# ═══════════════════════════════════════════════════════════════════════════════
# DIRECT MESSAGES (REST)
# ═══════════════════════════════════════════════════════════════════════════════

def _convo_id(a: str, b: str) -> str:
    return "_".join(sorted([a, b]))

@app.get("/messages/conversations")
@app.get("/dm/conversations")  # keep old path too
def get_conversations(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    # Collect all conversations this user participates in
    sent_docs = db.collection("dm_conversations").where(
        filter=FieldFilter("participants", "array_contains", username)
    ).get()

    # If the above fails (no 'participants' field yet), fall back to listing
    # all conversations whose doc ID contains the username
    # We store participants list on the parent conversation doc
    seen: dict[str, dict] = {}
    for doc in sent_docs:
        parts = doc.id.split("_")
        partner = parts[0] if parts[1] == username else parts[1]
        seen[partner] = doc.to_dict()

    result = []
    for partner_username, _convo in seen.items():
        partner = get_user(partner_username)
        if not partner:
            continue
        convo_ref = db.collection("dm_conversations").document(_convo_id(username, partner_username))
        msgs = convo_ref.collection("messages").order_by("created_at", direction=fs.Query.DESCENDING).limit(1).get()
        last_msg = None
        if msgs:
            last_msg = msgs[0].to_dict()

        unread_docs = convo_ref.collection("messages").where(
            filter=FieldFilter("sender", "==", partner_username)
        ).where(
            filter=FieldFilter("is_read", "==", False)
        ).get()

        result.append({
            "username": partner_username,
            "avatar_url": partner.get("avatar_url"),
            "level": partner.get("level", 1),
            "rank": get_user_rank(partner.get("level", 1)),
            "last_message": last_msg.get("content", "")[:80] if last_msg else "",
            "last_message_mine": last_msg.get("sender") == username if last_msg else False,
            "last_message_time": last_msg.get("created_at") if last_msg else None,
            "unread": len(unread_docs),
            "is_online": dm_manager.is_online(partner_username),
        })
    return result

@app.get("/messages/{username}")
@app.get("/dm/{username}/messages")  # keep old path too
def get_dm_thread(username: str, current_user: dict = Depends(get_current_user)):
    other = get_user(username)
    if not other:
        raise HTTPException(404, "Usuario no encontrado")

    me_username = current_user["username"]
    convo_ref = db.collection("dm_conversations").document(_convo_id(me_username, username))
    msgs = convo_ref.collection("messages").order_by("created_at").limit(150).get()

    # Mark incoming as read
    for msg_doc in msgs:
        m = msg_doc.to_dict()
        if m.get("sender") == username and not m.get("is_read", True):
            msg_doc.reference.update({"is_read": True})

    return [{
        "id": doc.id,
        "from_username": doc.to_dict().get("sender"),
        "from_avatar": current_user.get("avatar_url") if doc.to_dict().get("sender") == me_username else other.get("avatar_url"),
        "content": doc.to_dict().get("content"),
        "created_at": doc.to_dict().get("created_at"),
        "is_mine": doc.to_dict().get("sender") == me_username,
    } for doc in msgs]

@app.post("/messages/{username}")
def send_message(username: str, data: dict, current_user: dict = Depends(get_current_user)):
    other = get_user(username)
    if not other:
        raise HTTPException(404, "Usuario no encontrado")

    me_username = current_user["username"]
    content = (data.get("content") or "").strip()[:1000]
    if not content:
        raise HTTPException(400, "Contenido vacío")

    convo_id = _convo_id(me_username, username)
    convo_ref = db.collection("dm_conversations").document(convo_id)
    # Ensure conversation doc exists with participants
    convo_ref.set({"participants": sorted([me_username, username])}, merge=True)

    now = _fmt_time()
    _, msg_ref = convo_ref.collection("messages").add({
        "sender": me_username,
        "recipient": username,
        "content": content,
        "created_at": now,
        "is_read": False,
    })
    return {"msg": "Mensaje enviado", "id": msg_ref.id}

@app.put("/messages/{username}/read")
def mark_messages_read(username: str, current_user: dict = Depends(get_current_user)):
    me_username = current_user["username"]
    convo_ref = db.collection("dm_conversations").document(_convo_id(me_username, username))
    unread = convo_ref.collection("messages").where(
        filter=FieldFilter("sender", "==", username)
    ).where(
        filter=FieldFilter("is_read", "==", False)
    ).get()
    for doc in unread:
        doc.reference.update({"is_read": True})
    return {"msg": "Mensajes marcados como leídos"}

# ═══════════════════════════════════════════════════════════════════════════════
# CHAT (WebSocket + REST)
# ═══════════════════════════════════════════════════════════════════════════════

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    @property
    def online(self) -> int:
        return len(self.active)

manager = ConnectionManager()

def _fmt_time() -> str:
    return datetime.utcnow().strftime("%d/%m %H:%M")

@app.get("/chat/messages")
def get_chat_history():
    docs = db.collection("chat_messages").order_by(
        "created_at", direction=fs.Query.DESCENDING
    ).limit(80).get()
    return [
        {
            "id": doc.id,
            "username": doc.to_dict().get("username"),
            "avatar_url": doc.to_dict().get("avatar_url"),
            "content": doc.to_dict().get("content"),
            "created_at": doc.to_dict().get("created_at"),
        }
        for doc in reversed(list(docs))
    ]

@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket, token: str = None):
    await manager.connect(websocket)

    user_id, username, avatar_url = None, "Anónimo", None
    if token:
        try:
            payload = auth.decode_token(token)
            u = get_user(payload.get("sub"))
            if u:
                user_id = u.get("id")
                username = u["username"]
                avatar_url = u.get("avatar_url")
        except Exception:
            pass

    await manager.broadcast({
        "type": "system",
        "text": f"{username} se unió al chat",
        "online": manager.online,
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            content = (data.get("content") or "").strip()[:500]
            if not content:
                continue

            now = _fmt_time()
            _, msg_ref = db.collection("chat_messages").add({
                "user_id": user_id,
                "username": username,
                "avatar_url": avatar_url,
                "content": content,
                "created_at": now,
            })

            await manager.broadcast({
                "type": "chat",
                "id": msg_ref.id,
                "username": username,
                "avatar_url": avatar_url,
                "content": content,
                "created_at": now,
                "online": manager.online,
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({
            "type": "system",
            "text": f"{username} salió del chat",
            "online": manager.online,
        })
    except Exception:
        manager.disconnect(websocket)

# ═══════════════════════════════════════════════════════════════════════════════
# DIRECT MESSAGES (WebSocket)
# ═══════════════════════════════════════════════════════════════════════════════

class DMManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, username: str, ws: WebSocket):
        await ws.accept()
        self.connections[username] = ws

    def disconnect(self, username: str):
        self.connections.pop(username, None)

    async def send_to(self, username: str, payload: dict) -> bool:
        ws = self.connections.get(username)
        if not ws:
            return False
        try:
            await ws.send_json(payload)
            return True
        except Exception:
            self.disconnect(username)
            return False

    def is_online(self, username: str) -> bool:
        return username in self.connections

dm_manager = DMManager()

@app.websocket("/ws/dm")
async def ws_dm(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = auth.decode_token(token)
        user = get_user(payload.get("sub"))
    except Exception:
        await websocket.close(code=4001)
        return

    if not user:
        await websocket.close(code=4001)
        return

    await dm_manager.connect(user["username"], websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            msg_type = data.get("type")

            if msg_type == "send":
                to = (data.get("to") or "").strip()
                content = (data.get("content") or "").strip()[:1000]
                if not to or not content:
                    continue

                recipient = get_user(to)
                if not recipient:
                    continue

                now = _fmt_time()
                me_username = user["username"]
                convo_id = _convo_id(me_username, to)
                convo_ref = db.collection("dm_conversations").document(convo_id)
                convo_ref.set({"participants": sorted([me_username, to])}, merge=True)
                _, msg_ref = convo_ref.collection("messages").add({
                    "sender": me_username,
                    "recipient": to,
                    "content": content,
                    "created_at": now,
                    "is_read": False,
                })

                payload_out = {
                    "type": "message",
                    "id": msg_ref.id,
                    "from_username": me_username,
                    "from_avatar": user.get("avatar_url"),
                    "to": to,
                    "content": content,
                    "created_at": now,
                    "is_mine": False,
                }
                await dm_manager.send_to(to, payload_out)
                await websocket.send_json({**payload_out, "is_mine": True})

            elif msg_type == "read":
                other_username = (data.get("from") or "").strip()
                if not other_username:
                    continue
                me_username = user["username"]
                convo_ref = db.collection("dm_conversations").document(_convo_id(me_username, other_username))
                unread = convo_ref.collection("messages").where(
                    filter=FieldFilter("sender", "==", other_username)
                ).where(
                    filter=FieldFilter("is_read", "==", False)
                ).get()
                for doc in unread:
                    doc.reference.update({"is_read": True})

    except WebSocketDisconnect:
        dm_manager.disconnect(user["username"])
    except Exception:
        dm_manager.disconnect(user["username"])

# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATIONS (Crunchyroll — kept from original)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/integrations/crunchyroll/sync")
def sync_crunchyroll(creds: CrunchyrollCredentials):
    rust_service_url = "http://localhost:8082/sync"
    try:
        response = requests.post(rust_service_url, json=creds.dict())
        cr_data = response.json()

        if cr_data.get("status") == "success":
            user = get_user(creds.email)
            if not user:
                uid = next_user_id()
                hashed_pw = auth.get_password_hash(creds.password)
                db.collection("users").document(creds.email).set({
                    "id": uid,
                    "username": creds.email,
                    "password": hashed_pw,
                    "points": 0,
                    "level": 1,
                    "is_premium": False,
                    "is_admin": False,
                    "is_banned": False,
                    "avatar_url": None,
                    "banner_url": None,
                    "bio": None,
                    "location": None,
                    "spoilers_safe": 0,
                    "active_frame": None,
                    "active_emoji": None,
                    "active_banner": None,
                    "badge_keys": [],
                    "following": [],
                    "liked_comments": [],
                })
            token = auth.create_token({"sub": creds.email})
            return {
                "status": "success",
                "message": "Login successful via crunchyroll-rs!",
                "access_token": token,
                "token_type": "bearer",
                "history": cr_data.get("history"),
            }
        else:
            raise HTTPException(status_code=401, detail=f"Crunchyroll Login Failed: {cr_data.get('message')}")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Servicio de Crunchyroll no disponible")
