from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.sessions import Base

class DailyAverageDB(Base):
    __tablename__ = "daily_averages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    unit_id = Column(String(50), ForeignKey("units.unit_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Average values
    avg_height = Column(Float)
    avg_temperature = Column(Float)
    avg_battery = Column(Float)
    avg_rssi = Column(Float)
    avg_snr = Column(Float)
    
    # Min/Max values for height
    min_height = Column(Float)
    max_height = Column(Float)
    
    # Metadata
    measurement_count = Column(Integer)

    # Relationships
    unit = relationship("UnitDB", backref="daily_averages")

    def __repr__(self):
        return f"<DailyAverage(unit_id={self.unit_id}, date={self.date}, avg_height={self.avg_height})>"