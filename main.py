from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import requests
import os
from dotenv import load_dotenv
import database, models, auth

load_dotenv()

# Crear tablas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], # Puertos de Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# --- Pydantic Models (Schemas) ---
class UserCreate(BaseModel):
    username: str
    password: str

class BadgeSchema(BaseModel):
    name: str
    description: str
    icon: str
    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: int
    username: str
    points: int
    level: int
    badges: list[BadgeSchema]
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False # Si el usuario que consulta sigue a este perfil

class CommentCreate(BaseModel):
    content: str
    timestamp: int = 0

class CommentResponse(BaseModel):
    id: int
    user_id: int
    content: str
    timestamp: int
    created_at: str
    is_spoiler: int
    likes_count: int = 0
    is_liked: bool = False
    
    class Config:
        from_attributes = True

class TimeCapsuleCreate(BaseModel):
    anime_id: int
    unlock_episode: int
    content: str

class AnimeSearch(BaseModel):
    id: int
    title: str

# --- Endpoints ---

@app.get("/")
def root():
    return {"message": "Backend operativo"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    hashed_pw = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, password=hashed_pw)
    db.add(db_user)
    db.commit()
    return {"msg": "Usuario creado"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Login fallido")
    
    token = auth.create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me/profile", response_model=UserProfile)
@app.get("/users/me/profile", response_model=UserProfile)
def get_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
        
    return UserProfile(
        id=user.id,
        username=user.username,
        points=user.points,
        level=user.level,
        badges=user.badges,
        followers_count=len(user.followers),
        following_count=len(user.following),
        is_following=False
    )

@app.get("/users/{username}", response_model=UserProfile)
def get_public_profile(username: str, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Check if I am following him
    is_following = False
    try:
        user_data = auth.decode_token(token)
        me = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
        if me and target_user in me.following:
            is_following = True
    except: pass
    
    return UserProfile(
        id=target_user.id,
        username=target_user.username,
        points=target_user.points,
        level=target_user.level,
        badges=target_user.badges,
        followers_count=len(target_user.followers),
        following_count=len(target_user.following),
        is_following=is_following
    )

@app.post("/users/{user_id}/follow")
@app.post("/users/{user_id}/follow")
def follow_user(user_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    current_user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not target_user: raise HTTPException(status_code=404)
    if current_user.id == user_id: raise HTTPException(status_code=400, detail="No te puedes seguir a ti mismo")
    
    if target_user not in current_user.following:
        current_user.following.append(target_user)
        
        # Achievement: Follow 1st person
        if len(current_user.following) == 1:
            badge = db.query(models.Badge).filter(models.Badge.name == "Stalker Inicial").first()
            if not badge:
                badge = models.Badge(name="Stalker Inicial", description="Seguir a tu primer usuario", icon="👀")
                db.add(badge)
            if badge not in current_user.badges:
                current_user.badges.append(badge)
                
        db.commit()
        
    return {"msg": f"Ahora sigues a {target_user.username}"}

@app.post("/comments/{comment_id}/like")
@app.post("/comments/{comment_id}/like")
def like_comment(comment_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    
    if not comment: raise HTTPException(status_code=404)
    
    if user in comment.likes:
        comment.likes.remove(user)
        msg = "Like quitado"
    else:
        comment.likes.append(user)
        msg = "Like añadido"
        
        # Give points to comment owner
        if comment.user_id != user.id:
            comment.owner.points += 2
            db.add(comment.owner)
            
    db.commit()
    return {"msg": msg, "likes_count": len(comment.likes)}

@app.post("/comments/{comment_id}/report")
@app.post("/comments/{comment_id}/report")
def report_spoiler(comment_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    
    # Simple logic: If reported, mark as spoiler and give points to reporter
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404)
    
    report = models.SpoilerReport(reporter_id=user.id, comment_id=comment_id, status="confirmed")
    comment.is_spoiler = 1 # Auto-confirm for demo
    
    # Reward the reporter (The Guardian)
    user.points += 10
    if user.points >= user.level * 100:
        user.level += 1
        
    db.add(report)
    db.commit()
    return {"msg": "Reporte procesado. +10 puntos de Guardian."}

@app.post("/anime/capsule")
@app.post("/anime/capsule")
def bury_capsule(capsule: TimeCapsuleCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    
    new_capsule = models.TimeCapsule(
        user_id=user.id,
        anime_id=capsule.anime_id,
        episode_number=1, # Assume burying at start
        unlock_episode=capsule.unlock_episode,
        content=capsule.content,
        created_at="Now"
    )
    db.add(new_capsule)
    db.commit()
    return {"msg": "Cápsula enterrada. Se desbloqueará en el episodio " + str(capsule.unlock_episode)}

@app.get("/anime/{anime_id}/capsules")
@app.get("/anime/{anime_id}/capsules")
def get_capsules(anime_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    
    # Get user progress for this anime
    progress = db.query(models.UserAnimeProgress).filter(
        models.UserAnimeProgress.user_id == user.id,
        models.UserAnimeProgress.anime_id == anime_id
    ).all()
    max_ep = max([p.episode_number for p in progress]) if progress else 0
    
    capsules = db.query(models.TimeCapsule).filter(
        models.TimeCapsule.user_id == user.id,
        models.TimeCapsule.anime_id == anime_id
    ).all()
    
    results = []
    for c in capsules:
        if max_ep >= c.unlock_episode:
            results.append({"content": c.content, "locked": False, "unlock_at": c.unlock_episode})
        else:
            results.append({"content": "CONTENIDO BLOQUEADO", "locked": True, "unlock_at": c.unlock_episode})
            
    return results

@app.get("/anime/search")
def search_anime(query: str):
    url = os.getenv("ANILIST_API_URL")
    query_graphql = """
    query ($search: String) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: ANIME) {
          id
          title { romaji }
        }
      }
    }
    """
    response = requests.post(url, json={'query': query_graphql, 'variables': {"search": query}})
    return response.json()




@app.get("/anime/trending")
def get_trending_anime():
    url = os.getenv("ANILIST_API_URL")
    query_graphql = """
    query {
      Page(page: 1, perPage: 12) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          title { romaji }
          coverImage { extraLarge large }
          format
        }
      }
    }
    """
    response = requests.post(url, json={'query': query_graphql})
    return response.json()

@app.get("/anime/{id}")
def get_anime_details(id: int, db: Session = Depends(database.get_db)):
    url = os.getenv("ANILIST_API_URL")
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
      }
    }
    """
    response = requests.post(url, json={'query': query_graphql, 'variables': {"id": id}})
    data = response.json()
    
    media = data.get('data', {}).get('Media')
    if media:
        # Cache Anime
        anime = models.Anime(
            id=media['id'],
            title=media['title']['romaji'],
            description=media['description'] or "",
            cover_image=media['coverImage']['extraLarge'] or media['coverImage']['large'],
            banner_image=media['bannerImage'],
            episodes_count=media['episodes'] or 12,
            genres=",".join(media['genres'] or []),
            average_score=media['averageScore'],
            season=media['season'],
            season_year=media['seasonYear']
        )
        db.merge(anime) # merges based on PK (id)
        db.commit()

        # Cache Chapters (Simple)
        count = media['episodes'] or 12
        # Optimization: Fetch existing chapters for this anime
        existing_chapters = {c.number for c in db.query(models.Chapter).filter(models.Chapter.anime_id == media['id']).all()}
        
        new_chapters = []
        for i in range(1, count + 1):
             if i not in existing_chapters:
                 new_chapters.append(models.Chapter(
                     anime_id=media['id'],
                     number=i,
                     title=f"Episode {i}"
                 ))
        
        if new_chapters:
            db.add_all(new_chapters)
            db.commit()

    return data

class CrunchyrollCredentials(BaseModel):
    email: str
    password: str

@app.post("/integrations/crunchyroll/sync")
def sync_crunchyroll(creds: CrunchyrollCredentials, db: Session = Depends(database.get_db)):
    # 1. Llamada al microservicio de Rust para verificar credenciales reales
    rust_service_url = "http://localhost:8082/sync" 
    
    try:
        # Nota: En un caso real, no enviamos la pass en plano tan alegremente, pero es una demo
        response = requests.post(rust_service_url, json=creds.dict())
        cr_data = response.json()
        
        if cr_data.get("status") == "success":
            # 2. Login correcto en CR -> Sincronizar usuario local
            user = db.query(models.User).filter(models.User.username == creds.email).first()
            if not user:
                # Auto-register localmente
                hashed_pw = auth.get_password_hash(creds.password)
                user = models.User(username=creds.email, password=hashed_pw)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # 3. Generar Token JWT Local para SpoilerSafe
            token = auth.create_token({"sub": user.username})
            
            return {
                "status": "success",
                "message": "Login successful via crunchyroll-rs!",
                "access_token": token, # Token para usar en endpoints protegidos
                "token_type": "bearer",
                "history": cr_data.get("history")
            }
        else:
            raise HTTPException(status_code=401, detail=f"Crunchyroll Login Failed: {cr_data.get('message')}")

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Servicio de Crunchyroll no disponible")

# --- SpoilerSafe Endpoints ---



@app.get("/anime/{anime_id}/episodes/{episode_number}/comments")
def get_comments(anime_id: int, episode_number: int, token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    # Try to identify user if token is present
    user_id = None
    try:
        if token:
            user_data = auth.decode_token(token)
            user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
            if user: user_id = user.id
    except: pass

    comments = db.query(models.Comment).filter(
        models.Comment.anime_id == anime_id,
        models.Comment.episode_number == episode_number
    ).all()
    
    results = []
    for c in comments:
        is_liked = False
        if user_id:
             # Check if user in c.likes (efficient implementation depends on loading strategy, this is lazy)
             is_liked = any(u.id == user_id for u in c.likes)
             
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "content": c.content,
            "timestamp": c.timestamp,
            "created_at": c.created_at,
            "is_spoiler": c.is_spoiler,
            "likes_count": len(c.likes),
            "is_liked": is_liked
        })
    return results

@app.post("/anime/{anime_id}/episodes/{episode_number}/comments")
def create_comment(
    anime_id: int, 
    episode_number: int, 
    comment: CommentCreate, 
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    try:
        if not token: raise HTTPException(status_code=401, detail="Token requerido")
        user_data = auth.decode_token(token)
        user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
        if not user:
             raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        new_comment = models.Comment(
            user_id=user.id,
            anime_id=anime_id,
            episode_number=episode_number,
            content=comment.content,
            timestamp=comment.timestamp,
            created_at="Just now" 
        )
        
        # Points for commenting
        user.points += 5
        db.add(user)
        
        # Achievement: First Comment
        if len(user.comments) == 1:
             badge = db.query(models.Badge).filter(models.Badge.name == "Comentarista Novato").first()
             if not badge:
                 badge = models.Badge(name="Comentarista Novato", description="Tu primer comentario", icon="💬")
                 db.add(badge)
             if badge not in user.badges:
                 user.badges.append(badge)

        db.commit()
        return {"msg": "Comentario añadido (+5 puntos)"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating comment: {e}")
        raise HTTPException(status_code=500, detail="Error interno al crear comentario")

@app.post("/anime/{anime_id}/episodes/{episode_number}/watched")
def mark_watched(
    anime_id: int, 
    episode_number: int, 
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    
    # Check if already watched
    existing = db.query(models.UserAnimeProgress).filter(
        models.UserAnimeProgress.user_id == user.id,
        models.UserAnimeProgress.anime_id == anime_id,
        models.UserAnimeProgress.episode_number == episode_number
    ).first()
    
    if not existing:
        progress = models.UserAnimeProgress(
            user_id=user.id,
            anime_id=anime_id,
            episode_number=episode_number,
            is_watched=1
        )
        db.add(progress)
        db.commit()
    
    return {"msg": "Marcado como visto"}

@app.get("/users/me/progress")
@app.get("/users/me/progress")
def get_my_progress(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if not token: raise HTTPException(status_code=401, detail="Token requerido")
    user_data = auth.decode_token(token)
    user = db.query(models.User).filter(models.User.username == user_data.get("sub")).first()
    return db.query(models.UserAnimeProgress).filter(models.UserAnimeProgress.user_id == user.id).all()
