#include "config.h"


void setLoRa() {
    Serial.println("LoRa Transmitter Starting...");

    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

    if (!LoRa.begin(433E6)) {  // Set frequency to 433 MHz
        Serial.println("Starting LoRa failed!");
        while (1);
    }
    
    // Configure LoRa parameters for better reliability
    LoRa.setTxPower(20);        // Set TX power to 20dBm
    LoRa.setSpreadingFactor(7); // Set spreading factor (6-12)
    LoRa.setSignalBandwidth(125E3); // Set bandwidth
    LoRa.setCodingRate4(5);     // Set coding rate
    LoRa.enableCrc();           // Enable CRC checking
    
    Serial.println("LoRa Transmitter ready");
    Serial.println("======================");
}

void sendLoRaMessage(const String& Topic,const String& message) {
    String fullMessage = "Unit " + String(UNIT_ID) + ": " + " Topic: " + Topic + " Message: " + message;

    Serial.print("Sending LoRa message: ");
    Serial.println(fullMessage);

    LoRa.beginPacket();
    LoRa.print(fullMessage);
    LoRa.endPacket();
    
    Serial.println("Message sent successfully");
}
