import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

class Album(Base):
    __tablename__ = "albums"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assets = relationship("Asset", back_populates="album", cascade="all, delete")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    album_id = Column(String, ForeignKey("albums.id"))
    file_path = Column(String, nullable=False)
    thumb_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    album = relationship("Album", back_populates="assets")
