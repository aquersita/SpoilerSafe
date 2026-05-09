from sqlalchemy import Column, Integer, String, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from database import Base

user_badges = Table(
    "user_badges",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("badge_id", Integer, ForeignKey("badges.id"))
)

user_follows = Table(
    "user_follows",
    Base.metadata,
    Column("follower_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("followed_id", Integer, ForeignKey("users.id"), primary_key=True)
)

comment_likes = Table(
    "comment_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("comment_id", Integer, ForeignKey("comments.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    is_premium = Column(Integer, default=0)
    is_admin = Column(Integer, default=0)
    is_banned = Column(Integer, default=0)

    avatar_url = Column(String(255), nullable=True)
    banner_url = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    location = Column(String(100), nullable=True)

    # Gamification extras (added via migration for existing DBs)
    spoilers_safe = Column(Integer, default=0)
    active_frame = Column(String(50), nullable=True)
    active_emoji = Column(String(50), nullable=True)
    active_banner = Column(String(50), nullable=True)

    badges = relationship("Badge", secondary=user_badges, back_populates="users")

    followers = relationship(
        "User",
        secondary=user_follows,
        primaryjoin=id==user_follows.c.followed_id,
        secondaryjoin=id==user_follows.c.follower_id,
        backref="following"
    )

    comments = relationship("Comment", back_populates="owner")

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True)
    description = Column(String(255))
    icon = Column(String(50))

    users = relationship("User", secondary=user_badges, back_populates="badges")

class Anime(Base):
    __tablename__ = "animes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text)
    cover_image = Column(String(255))
    banner_image = Column(String(255))
    episodes_count = Column(Integer)
    genres = Column(String(255))
    average_score = Column(Integer)
    season = Column(String(50))
    season_year = Column(Integer)

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    anime_id = Column(Integer, ForeignKey("animes.id"))
    number = Column(Integer)
    title = Column(String(255), nullable=True)

class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    text = Column(String(255))
    emoji = Column(String(10))

class UserAnimeProgress(Base):
    __tablename__ = "user_anime_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    episode_number = Column(Integer)
    is_watched = Column(Integer, default=0)

class UserMangaProgress(Base):
    __tablename__ = "user_manga_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    manga_id = Column(Integer)
    chapter_number = Column(Integer)
    is_read = Column(Integer, default=1)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    episode_number = Column(Integer)
    content = Column(String(500))
    is_spoiler = Column(Integer, default=0)
    created_at = Column(String(50))
    timestamp = Column(Integer, default=0)

    owner = relationship("User", back_populates="comments")
    likes = relationship("User", secondary=comment_likes, backref="liked_comments")

class SpoilerReport(Base):
    __tablename__ = "spoiler_reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    comment_id = Column(Integer, ForeignKey("comments.id"))
    status = Column(String(20), default="pending")

class TimeCapsule(Base):
    __tablename__ = "time_capsules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    episode_number = Column(Integer)
    unlock_episode = Column(Integer)
    content = Column(Text)
    created_at = Column(String(50))

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    added_at = Column(String(50))

class RestrictedContent(Base):
    __tablename__ = "restricted_content"
    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(20))
    anilist_id = Column(Integer)
    title = Column(String(255), nullable=True)
    reason = Column(String(255), nullable=True)
    restricted_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(String(50))

class AnimeRecommendation(Base):
    __tablename__ = "anime_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    media_id = Column(Integer)
    media_type = Column(String(10), default="anime")
    title = Column(String(255))
    cover_image = Column(String(255), nullable=True)
    reason = Column(String(500))
    created_at = Column(String(50))

class RecommendationLike(Base):
    __tablename__ = "recommendation_likes"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    recommendation_id = Column(Integer, ForeignKey("anime_recommendations.id"), primary_key=True)

class UserGameSession(Base):
    __tablename__ = "user_game_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game_id = Column(String(50))
    game_title = Column(String(255), nullable=True)
    played_at = Column(String(50))

class DirectMessage(Base):
    __tablename__ = "direct_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String(1000))
    created_at = Column(String(30))
    is_read = Column(Integer, default=0)

class UserFavorite(Base):
    __tablename__ = "user_favorites"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    media_id = Column(Integer)
    media_type = Column(String(10), default="anime")
    title = Column(String(255))
    cover_image = Column(String(255), nullable=True)
    banner_image = Column(String(255), nullable=True)
    genres = Column(String(500), nullable=True)
    average_score = Column(Integer, nullable=True)
    added_at = Column(String(50))

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50))
    avatar_url = Column(String(255), nullable=True)
    content = Column(String(500))
    created_at = Column(String(30))
