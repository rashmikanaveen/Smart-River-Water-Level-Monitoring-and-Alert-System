from sqlalchemy import Column, String, DateTime, Float, Boolean, func
from app.db.sessions import Base

class UnitDB(Base):
    __tablename__ = "units"

    unit_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    
    # Alert levels
    warning_level = Column(Float)
    high_level = Column(Float)
    critical_level = Column(Float)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())