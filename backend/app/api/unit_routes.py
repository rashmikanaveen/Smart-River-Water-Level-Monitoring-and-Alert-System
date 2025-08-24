from fastapi import APIRouter
from app.services.unit_service import unit_service
from app.models.unit import Unit

router = APIRouter()

@router.post("/addunit")
def add_unit(unit: Unit):
    saved_unit = unit_service.add_unit(unit.unit_id, unit.name)
    return {"message": "Unit added", "unit": saved_unit}

@router.get("/units")
def list_units():
    return unit_service.list_units()