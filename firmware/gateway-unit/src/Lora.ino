#include "config.h"

void LoRaSetup() {
  Serial.println("LoRa Receiver Starting...");
  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
  
  // Configure LoRa parameters (must match transmitter)
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.enableCrc();
  
  Serial.println("LoRa Receiver ready");
  Serial.println("===================");
}

String LoRaReceive() {
  // Check for incoming packets
  int packetSize = LoRa.parsePacket();
  String enhancedMessage = "";
  
  if (packetSize) {
    // Read packet into string buffer safely
    String receivedMessage = "";
    
    // Read all available bytes
    while (LoRa.available()) {
      char c = LoRa.read();
      if (c >= 32 && c <= 126) { // Only printable ASCII characters
        receivedMessage += c;
      }
    }
    
    // Only process if we received a valid message
    if (receivedMessage.length() > 0) {
      // Get signal quality parameters
      int rssi = LoRa.packetRssi();
      float snr = LoRa.packetSnr();
      
      // Create enhanced JSON by adding RSSI and SNR only
      // Remove the closing brace from original message
      String baseMessage = receivedMessage;
      if (baseMessage.endsWith("}")) {
        baseMessage = baseMessage.substring(0, baseMessage.length() - 1);
      }
      
      // Add signal strength fields to JSON
      enhancedMessage = baseMessage + ",\"rssi\":" + String(rssi) + 
                       ",\"snr\":" + String(snr, 2) + "}";
      
      Serial.println("=== PACKET RECEIVED ===");
      Serial.println("Message: " + receivedMessage);
      Serial.print("RSSI: ");
      Serial.print(rssi);
      Serial.println(" dBm");
      Serial.print("SNR: ");
      Serial.print(snr, 2);
      Serial.println(" dB");
      Serial.print("Packet Size: ");
      Serial.print(packetSize);
      Serial.println(" bytes");
      Serial.println("=======================");
    }
  }
  
  // Small delay to prevent watchdog issues
  delay(10);
  return enhancedMessage;
}