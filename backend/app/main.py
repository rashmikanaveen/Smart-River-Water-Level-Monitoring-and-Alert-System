import asyncio
from fastapi import FastAPI,APIRouter
from app.mqtt_client import mqtt_client, connect_mqtt

async def lifespan(app):
    loop = asyncio.get_event_loop()
    await connect_mqtt(loop)
    yield
    await mqtt_client.disconnect()

app = FastAPI(title="Digital Farm Backend", lifespan=lifespan)
router = APIRouter(prefix="/api", tags=["Root"])

@app.get("/")
def read_root():
    return {"Hello": "World"}

#@router.get("/")
#def read_root():
#    return {"Hello": "World"}
#
#app.include_router(router)