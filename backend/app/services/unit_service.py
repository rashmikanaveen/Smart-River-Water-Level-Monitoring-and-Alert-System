from app.models.unit import Unit

class UnitService:
    def __init__(self):
        self.units = {}  # In-memory store: {unit_id: Unit}

    def add_unit(self, unit_id: str, name: str = "") -> Unit:
        unit = Unit(unit_id=unit_id, name=name)
        self.units[unit_id] = unit
        return unit

    def get_unit(self, unit_id: str) -> Unit | None:
        return self.units.get(unit_id)

    def list_units(self):
        return list(self.units.values())

unit_service = UnitService()