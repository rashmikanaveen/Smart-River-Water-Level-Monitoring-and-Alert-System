from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # Application
    APP_NAME: str = "Smart River Water Level Monitoring"
    VERSION: str = "1.0.0"
    
    # MQTT Configuration
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT"))
    MQTT_CLIENT_ID: str = os.getenv("MQTT_CLIENT_ID")
    MQTT_TOPICS: List[str] = os.getenv("MQTT_TOPICS").split(",")
    
    # JWT Authentication Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

settings = Settings()