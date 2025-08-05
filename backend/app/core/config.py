from typing import List

class Settings:
    # Application
    APP_NAME: str = "Smart River Water Level Monitoring"
    VERSION: str = "1.0.0"
    
    # MQTT Configuration
    MQTT_BROKER_HOST: str = "broker.hivemq.com"
    MQTT_BROKER_PORT: int = 1883
    MQTT_CLIENT_ID: str = "smart-river-monitoring"
    MQTT_TOPICS: List[str] = ["lora/water_lavel"]

settings = Settings()