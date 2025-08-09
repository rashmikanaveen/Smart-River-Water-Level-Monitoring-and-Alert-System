#include "config.h"

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void setup() {
  Serial.begin(115200);
  delay(1000);
  setupMQTT();
  LoRaSetup();
  setupWiFi();
  
  
}

void loop() {
  if(!mqttClient.connected()){
    connectToBroker();
  }
  mqttClient.loop();

  String message = LoRaReceive();
  if (message.length() > 0) {
    Serial.println("Received LoRa message: " + message);
    mqttClient.publish("lora/water_lavel", message.c_str());
  }

  
  
}

