from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.sessions import Base  # <-- Fix import

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())