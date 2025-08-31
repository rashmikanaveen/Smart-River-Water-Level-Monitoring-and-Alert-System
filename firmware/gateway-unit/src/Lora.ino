#include "config.h"
#include "BinaryProtocol.h"

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
    // Check if packet size matches our binary protocol
    if (packetSize == BINARY_PACKET_SIZE) {
      // Handle binary protocol
      uint8_t buffer[BINARY_PACKET_SIZE];
      
      // Read binary data
      for (int i = 0; i < packetSize && LoRa.available(); i++) {
        buffer[i] = LoRa.read();
      }
      
      // Unpack binary data
      uint16_t deviceId;
      float distance, temperature;
      uint8_t batteryPercentage;
      
      if (unpackSensorData(buffer, deviceId, distance, temperature, batteryPercentage)) {
        // Get signal quality parameters
        int rssi = LoRa.packetRssi();
        float snr = LoRa.packetSnr();
        
        // Convert to JSON with RSSI and SNR only (format device ID with leading zeros)
        String formattedDeviceId = String(deviceId);
        if (deviceId < 10) {
          formattedDeviceId = "00" + String(deviceId);
        } else if (deviceId < 100) {
          formattedDeviceId = "0" + String(deviceId);
        }
        
        enhancedMessage = "{\"i\":\"" + formattedDeviceId + "\",";
        enhancedMessage += "\"d\":" + String(distance, 2) + ",";
        enhancedMessage += "\"t\":" + String(temperature, 2) + ",";
        enhancedMessage += "\"b\":" + String(batteryPercentage) + ",";
        enhancedMessage += "\"rssi\":" + String(rssi) + ",";
        enhancedMessage += "\"snr\":" + String(snr, 2) + "}";
        
        Serial.println("=== BINARY PACKET RECEIVED ===");
        Serial.println("Device ID: " + String(deviceId));
        Serial.println("Distance: " + String(distance, 2) + " cm");
        Serial.println("Temperature: " + String(temperature, 2) + " °C");
        Serial.println("Battery: " + String(batteryPercentage) + "%");
        Serial.print("RSSI: ");
        Serial.print(rssi);
        Serial.println(" dBm");
        Serial.print("SNR: ");
        Serial.print(snr, 2);
        Serial.println(" dB");
        Serial.println("MQTT JSON: " + enhancedMessage);
        Serial.println("==============================");
        
        printBinaryData(buffer, BINARY_PACKET_SIZE);
      } else {
        Serial.println("=== BINARY PACKET CRC ERROR ===");
        Serial.print("Packet Size: ");
        Serial.print(packetSize);
        Serial.println(" bytes");
        printBinaryData(buffer, BINARY_PACKET_SIZE);
        Serial.println("===============================");
      }
    } else {
      // Unknown packet size - log and ignore
      Serial.println("=== UNKNOWN PACKET SIZE ===");
      Serial.print("Packet Size: ");
      Serial.print(packetSize);
      Serial.println(" bytes (ignoring non-binary packet)");
      
      // Clear the buffer without processing
      while (LoRa.available()) {
        LoRa.read();
      }
      Serial.println("===========================");
    }
  }
  
  // Small delay to prevent watchdog issues
  delay(10);
  return enhancedMessage;
}