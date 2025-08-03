# app/mqtt_client.py
from gmqtt import Client as MQTTClient
import asyncio


mqtt_client = MQTTClient("digital-farm-backend")

TOPICS = ["rashmikanaveen-mqtt-Test", "rashmikapico2", "Distance"]

async def connect_mqtt(loop):
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    await mqtt_client.connect("broker.hivemq.com", port=1883)
    #mqtt_client.set_auth_credentials("my_user", "my_pass")
    #await mqtt_client.connect("your.broker.com", port=1883)


def on_connect(client, flags, rc, properties):
    print("✅ MQTT connected!")
    for topic in TOPICS:
        client.subscribe(topic)

def on_message(client, topic, payload, qos, properties):
    
    print(f"📡 [{topic}] {payload.decode()}")


