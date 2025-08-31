#include "BinaryProtocol.h"

// CRC-16 CCITT polynomial: 0x1021
uint16_t calculateCRC16(uint8_t* data, uint8_t length) {
  uint16_t crc = 0xFFFF;
  
  for (uint8_t i = 0; i < length; i++) {
    crc ^= ((uint16_t)data[i] << 8);
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return crc;
}

// Pack sensor data into binary format
bool packSensorData(String deviceId, float distance, float temperature, int batteryPercentage, uint8_t* buffer) {
  if (!buffer) return false;
  
  SensorData* packet = (SensorData*)buffer;
  
  // Convert and pack data
  packet->deviceId = deviceId.toInt();
  
  // Distance: clamp negative values to 0, since distance can't be negative
  float clampedDistance = (distance < 0) ? 0.0 : distance;
  packet->distance = (uint16_t)(clampedDistance * 100);  // Convert to fixed-point (unsigned)
  
  packet->temperature = (int16_t)(temperature * 100); // Convert to fixed-point (signed)
  packet->batteryLevel = (uint8_t)batteryPercentage;
  
  // Calculate CRC for all data except CRC field
  packet->crc = calculateCRC16(buffer, sizeof(SensorData) - 2);
  
  return true;
}

// Unpack binary data and verify CRC
bool unpackSensorData(uint8_t* buffer, uint16_t& deviceId, float& distance, float& temperature, uint8_t& batteryPercentage) {
  if (!buffer) return false;
  
  SensorData* packet = (SensorData*)buffer;
  
  // Verify CRC
  uint16_t calculatedCRC = calculateCRC16(buffer, sizeof(SensorData) - 2);
  if (packet->crc != calculatedCRC) {
    Serial.printf("CRC Error! Expected: 0x%04X, Got: 0x%04X\n", calculatedCRC, packet->crc);
    return false;
  }
  
  // Unpack data
  deviceId = packet->deviceId;
  distance = (float)packet->distance / 100.0;          // Convert from unsigned fixed-point
  temperature = (float)packet->temperature / 100.0;    // Convert from signed fixed-point
  batteryPercentage = packet->batteryLevel;
  
  return true;
}

// Print binary data in hex format for debugging
void printBinaryData(uint8_t* data, size_t length) {
  Serial.print("Binary data (");
  Serial.print(length);
  Serial.print(" bytes): ");
  for (size_t i = 0; i < length; i++) {
    if (data[i] < 0x10) Serial.print("0");
    Serial.print(data[i], HEX);
    Serial.print(" ");
  }
  Serial.println();
}

// Convert binary data back to JSON format (for compatibility)
String binaryToJSON(uint16_t deviceId, float distance, float temperature, uint8_t batteryPercentage) {
  String json = "{";
  json += "\"i\":\"" + String(deviceId, DEC) + "\",";
  json += "\"d\":" + String(distance, 2) + ",";
  json += "\"t\":" + String(temperature, 2) + ",";
  json += "\"b\":" + String(batteryPercentage);
  json += "}";
  return json;
}
