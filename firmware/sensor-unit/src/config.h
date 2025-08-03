#ifndef CONFIG_H
#define CONFIG_H



#include "WiFi.h"
#include "esp_wifi.h"
#include "esp_bt.h"
#include <SPI.h>
#include <LoRa.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "ImprovedDistanceKalman.h"




void disableWiFi();
void disableBluetooth();
void setLoRa();
void sendLoRaMessage(const String& Topic,const String& message);



float getJSNDistance();
float getMedianDistance(int samples );
void setupSensors();


// LoRa configuration
#define SS_PIN    5   // LoRa radio chip select
#define RST_PIN   14  // LoRa radio reset
#define DIO0_PIN  2   // LoRa radio DIO0
#define UNIT_ID   1   // Unit identifier


// Temperature sensor pin
#define tempPin 4

// JSN-SR04T sensor pins
#define echoPin 25
#define trigPin 33





ImprovedDistanceKalman distanceFilter;


#endif