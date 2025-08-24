from pydantic import BaseModel
from typing import Optional

class AlertLevels(BaseModel):
    warning: Optional[float] = None
    high: Optional[float] = None
    critical: Optional[float] = None

class Unit(BaseModel):
    unit_id: str
    name: str = ""
    alertLevels: AlertLevels = AlertLevels()