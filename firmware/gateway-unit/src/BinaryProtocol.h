#ifndef BINARY_PROTOCOL_H
#define BINARY_PROTOCOL_H

#include <Arduino.h>

// Data packet structure
struct SensorData {
  uint16_t deviceId;      // Device ID (2 bytes)
  uint16_t distance;      // Distance * 100 (2 bytes, 2 decimal places, unsigned 0-655.35cm)
  int16_t temperature;    // Temperature * 100 (2 bytes, 2 decimal places, signed)
  uint8_t batteryLevel;   // Battery percentage (1 byte)
  uint16_t crc;          // CRC-16 checksum (2 bytes)
} __attribute__((packed)); // Total: 9 bytes

// Function declarations
uint16_t calculateCRC16(uint8_t* data, uint8_t length);
bool packSensorData(String deviceId, float distance, float temperature, int batteryPercentage, uint8_t* buffer);
bool unpackSensorData(uint8_t* buffer, uint16_t& deviceId, float& distance, float& temperature, uint8_t& batteryPercentage);
void printBinaryData(uint8_t* data, size_t length);
String binaryToJSON(uint16_t deviceId, float distance, float temperature, uint8_t batteryPercentage);

#define BINARY_PACKET_SIZE sizeof(SensorData)

#endif
