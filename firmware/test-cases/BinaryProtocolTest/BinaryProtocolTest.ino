#include <Arduino.h>
#include "BinaryProtocol.h"

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("Binary Protocol Test");
  Serial.println("===================");
  
  // Test data
  String deviceId = "001";
  float distance = 123.45;
  float temperature = 26.78;
  int batteryPercentage = 85;
  
  // Create binary packet
  uint8_t binaryData[BINARY_PACKET_SIZE];
  
  Serial.println("Original Data:");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Distance: " + String(distance, 2) + " cm");
  Serial.println("Temperature: " + String(temperature, 2) + " °C");
  Serial.println("Battery: " + String(batteryPercentage) + "%");
  Serial.println();
  
  // Pack data
  if (packSensorData(deviceId, distance, temperature, batteryPercentage, binaryData)) {
    Serial.println("✓ Data packed successfully");
    printBinaryData(binaryData, BINARY_PACKET_SIZE);
    Serial.println();
    
    // Unpack data
    uint16_t unpackedDeviceId;
    float unpackedDistance, unpackedTemperature;
    uint8_t unpackedBattery;
    
    if (unpackSensorData(binaryData, unpackedDeviceId, unpackedDistance, unpackedTemperature, unpackedBattery)) {
      Serial.println("✓ Data unpacked and CRC verified successfully");
      Serial.println("Unpacked Data:");
      Serial.println("Device ID: " + String(unpackedDeviceId));
      Serial.println("Distance: " + String(unpackedDistance, 2) + " cm");
      Serial.println("Temperature: " + String(unpackedTemperature, 2) + " °C");
      Serial.println("Battery: " + String(unpackedBattery) + "%");
      Serial.println();
      
      // Convert back to JSON
      String jsonOutput = binaryToJSON(unpackedDeviceId, unpackedDistance, unpackedTemperature, unpackedBattery);
      Serial.println("JSON Output: " + jsonOutput);
      Serial.println();
      
      // Size comparison
      String originalJSON = "{\"i\":\"001\",\"d\":123.45,\"t\":26.78,\"b\":85}";
      Serial.println("Size Comparison:");
      Serial.println("Original JSON: " + String(originalJSON.length()) + " bytes");
      Serial.println("Binary format: " + String(BINARY_PACKET_SIZE) + " bytes");
      float reduction = ((float)(originalJSON.length() - BINARY_PACKET_SIZE) / originalJSON.length()) * 100;
      Serial.println("Size reduction: " + String(reduction, 1) + "%");
      
    } else {
      Serial.println("✗ CRC verification failed!");
    }
  } else {
    Serial.println("✗ Failed to pack data");
  }
  
  Serial.println();
  Serial.println("Test with corrupted data:");
  
  // Test CRC error detection
  binaryData[5] = 0xFF; // Corrupt a byte
  uint16_t corruptedDeviceId;
  float corruptedDistance, corruptedTemperature;
  uint8_t corruptedBattery;
  
  if (unpackSensorData(binaryData, corruptedDeviceId, corruptedDistance, corruptedTemperature, corruptedBattery)) {
    Serial.println("✗ Should have failed CRC check!");
  } else {
    Serial.println("✓ CRC error detection working correctly");
  }
}

void loop() {
  // Test runs once in setup
  delay(1000);
}
