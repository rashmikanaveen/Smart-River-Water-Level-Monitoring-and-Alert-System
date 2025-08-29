from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.sessions import Base

class SensorMeasurementDB(Base):
    __tablename__ = "sensor_measurements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    unit_id = Column(String(50), ForeignKey("units.unit_id"), nullable=False, index=True)
    height = Column(Float, nullable=False)
    temperature = Column(Float)
    battery = Column(Float)
    rssi = Column(Float)
    snr = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship
    unit = relationship("UnitDB", backref="measurements")