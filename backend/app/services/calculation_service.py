from datetime import datetime
from typing import Dict, Any

class CalculationService:
    def __init__(self):
        pass
    
    def process_distance_data(self, distance_value: float) -> Dict[str, Any]:
        """
        Process distance data and perform calculations
        For now: multiply by 2
        """
        try:
            calculated_value = distance_value * 2
            
            return {
                "topic": "Distance",
                "original_distance": distance_value,
                "calculated_value": calculated_value,
                "calculation_type": "multiply_by_2",
                "timestamp": datetime.now().isoformat(),
                "unit": "cm",
                "status": "success"
            }
        except Exception as e:
            return {
                "topic": "Distance",
                "original_distance": distance_value,
                "calculated_value": None,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "status": "error"
            }

# Create singleton instance
calculation_service = CalculationService()