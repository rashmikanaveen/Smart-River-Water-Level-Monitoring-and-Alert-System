#include "WiFi.h"
#include "esp_wifi.h"
#include "esp_bt.h"
#include <SPI.h>
#include <LoRa.h>
#include<WiFiManager.h>
#include <PubSubClient.h>

extern WiFiClient espClient;
extern PubSubClient mqttClient;



void LoRaSetup();
String LoRaReceive();
void setupWiFi();
void setupMQTT();
void connectToBroker();
void receviveCallback(char* topic, byte* payload, unsigned int length);


#define SS_PIN    5   // LoRa radio chip select
#define RST_PIN   14  // LoRa radio reset
#define DIO0_PIN  2   // LoRa radio DIO0