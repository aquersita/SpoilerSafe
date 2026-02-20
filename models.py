from sqlalchemy import Column, Integer, String, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from database import Base

# Tabla intermedia para Usuarios y Medallas
user_badges = Table(
    "user_badges",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("badge_id", Integer, ForeignKey("badges.id"))
)

# Tabla intermedia para Seguidores
user_follows = Table(
    "user_follows",
    Base.metadata,
    Column("follower_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("followed_id", Integer, ForeignKey("users.id"), primary_key=True)
)

# Tabla intermedia para Likes en Comentarios
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
    
    badges = relationship("Badge", secondary=user_badges, back_populates="users")
    
    # Self-referential relationship for followers/following
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
    icon = Column(String(50)) # Emoji o nombre de icono
    
    users = relationship("User", secondary=user_badges, back_populates="badges")

class Anime(Base):
    __tablename__ = "animes"
    id = Column(Integer, primary_key=True, index=True) # AniList ID
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

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    episode_number = Column(Integer)
    content = Column(String(500))
    is_spoiler = Column(Integer, default=0)
    created_at = Column(String(50))
    timestamp = Column(Integer, default=0) # Segundos desde el inicio del episodio (0 = sin timestamp)

    owner = relationship("User", back_populates="comments")
    likes = relationship("User", secondary=comment_likes, backref="liked_comments")

class SpoilerReport(Base):
    __tablename__ = "spoiler_reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    comment_id = Column(Integer, ForeignKey("comments.id"))
    status = Column(String(20), default="pending") # pending, confirmed, rejected

class TimeCapsule(Base):
    __tablename__ = "time_capsules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    anime_id = Column(Integer)
    episode_number = Column(Integer) # Episodio donde se enterró
    unlock_episode = Column(Integer) # Episodio para desbloquearla
    content = Column(Text)
    created_at = Column(String(50))
