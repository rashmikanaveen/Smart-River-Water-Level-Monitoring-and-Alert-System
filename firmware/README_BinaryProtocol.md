# Binary Protocol Implementation for LoRa Communication

This implementation provides a compact binary data format with CRC error detection for reliable sensor data transmission via LoRa.

## Protocol Diagram

### Data Flow Architecture
```
┌─────────────────┐    LoRa Radio    ┌─────────────────┐      WiFi/mqtt    ┌─────────────────┐
│   Sensor Unit   │ ◄─────────────►  │  Gateway Unit   │ ◄───────────────► │   MQTT Broker   │
│                 │   Binary/JSON    │                 │      JSON         │                 │
│ ┌─────────────┐ │     433MHz       │ ┌─────────────┐ │                   │ ┌─────────────┐ │
│ │  Sensors    │ │                  │ │    LoRa     │ │                   │ │   Backend   │ │
│ │ ─ Distance  │ │                  │ │    WiFi     │ │                   │ │   Server    │ │
│ │ ─ Temp      │ │                  │ │ Data Proc   │ │                   │ │   Database  │ │
│ │ ─ Battery   │ │                  │ └─────────────┘ │                   │ └─────────────┘ │
│ └─────────────┘ │                  └─────────────────┘                   └─────────────────┘
└─────────────────┘                                                        
```

### Binary Packet Structure (9 bytes)
```
┌─────────────────────────────────────────────────────────────────────┐
│                      Binary Data Packet (9 bytes)                   │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│ Byte │  0   │  1   │  2   │  3   │  4   │  5   │  6   │  7   │  8   │
├──────┼──────┴──────┼──────┴──────┼──────┴──────┼──────┼──────┴──────┤
│ Data │ Device  ID  │ Distance*100│Temperature  │ Batt │   CRC-16    │
│      │  (16-bit)   │(unsigned    │*100(signed  │ (8b) │   (16-bit)  │
│      │             │  16-bit)    │   16-bit)   │      │             │
├──────┼─────────────┼─────────────┼─────────────┼──────┼─────────────┤
│Range │   0-65535   │   0 to      │ -327.68°C to│ 0-100│ Error Check │
│      │             │  655.35cm   │ +327.67°C   │      │             │
└──────┴─────────────┴─────────────┴─────────────┴──────┴─────────────┘
```

### Bit-Level Data Format
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIELD BREAKDOWN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Device ID (16-bit):                                                        │
│  ┌─────────────────┬─────────────────┐                                      │
│  │   Low Byte (0)  │  High Byte (1)  │  Example: 001 → 0x0001               │
│  └─────────────────┴─────────────────┘                                      │
│                                                                             │
│  Distance (unsigned 16-bit, fixed-point *100):                              │
│  ┌─────────────────┬─────────────────┐                                      │
│  │   Low Byte (2)  │  High Byte (3)  │  Example: 54.32cm → 5432 → 0x153A    │
│  └─────────────────┴─────────────────┘           0.00cm → 0 → 0x0000        │
│                                                   (negative values → 0)     │
│                                                                             │
│  Temperature (signed 16-bit, fixed-point *100):                             │
│  ┌─────────────────┬─────────────────┐                                      │
│  │   Low Byte (4)  │  High Byte (5)  │  Example: 26.78°C → 2678 → 0x0A76    │
│  └─────────────────┴─────────────────┘           -2.5°C → -250 → 0xFF06     │
│                                                                             │
│  Battery Level (8-bit):                                                     │
│  ┌─────────────────┐                                                        │
│  │   Byte (6)      │  Example: 75% → 0x4B                                   │
│  └─────────────────┘                                                        │
│                                                                             │
│  CRC-16 CCITT (16-bit):                                                     │
│  ┌─────────────────┬─────────────────┐                                      │
│  │  Low Byte (7)   │  High Byte (8)  │  Checksum of bytes 0-6               │
│  └─────────────────┴─────────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```



## Features

### Data Compression
- **JSON Format**: `{"i":"001","d":54.32,"t":26.69,"b":75}` = ~35 bytes
- **Binary Format**: 9 bytes (74% size reduction)

### Packet Structure (9 bytes)
```
Byte 0-1:  Device ID (16-bit unsigned)
Byte 2-3:  Distance * 100 (16-bit unsigned, 0-655.35cm, negatives clamped to 0)
Byte 4-5:  Temperature * 100 (16-bit signed, -327.68°C to +327.67°C)
Byte 6:    Battery Level (8-bit, 0-100%)
Byte 7-8:  CRC-16 Checksum
```

### Error Detection
- **CRC-16 CCITT**: Detects data corruption during transmission
- **Automatic validation**: Receiver automatically discards corrupted packets

## Data Encoding Process

### Step 1: Data Collection
```
Raw Sensor Data:
├── Device ID: "001" (String)
├── Distance: 54.32 cm (Float)
├── Temperature: 26.78°C (Float)
└── Battery: 75% (Integer)
```

### Step 2: Data Conversion
```
Fixed-Point Conversion & Validation:
├── Device ID: "001" → 1 (uint16_t)
├── Distance: 54.32 → 5432 (uint16_t, *100, negative values clamped to 0)
├── Temperature: 26.78 → 2678 (int16_t, *100, supports negative values)
├── Battery: 75 → 75 (uint8_t)
└── CRC: Calculate from bytes 0-6
```

### Step 3: Binary Packing
```
Memory Layout (Little Endian):
┌────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 01 │ 00 │ 3A │ 15 │ 76 │ 0A │ 4B │ XX │ XX │
└────┴────┴────┴────┴────┴────┴────┴────┴────┘
  ↑    ↑    ↑    ↑    ↑    ↑    ↑    ↑    ↑
 ID_L ID_H DIST_L DIST_H TEMP_L TEMP_H BATT CRC_L CRC_H
```

### Step 4: CRC Calculation
```
CRC-16 CCITT Algorithm:
Input: Bytes 0-6 (7 bytes)
Polynomial: 0x1021
Initial: 0xFFFF
Result: 2-byte checksum → Bytes 7-8
```

## Communication Flow

### Transmission Process
```
Sensor Unit                     Gateway Unit
     │                              │
     ├─1. Read Sensors──────────────┤
     ├─2. Pack Binary Data──────────┤
     ├─3. Calculate CRC─────────────┤
     ├─4. LoRa.write(binary)───────→│
     │                              ├─5. Receive Packet
     │                              ├─6. Verify CRC
     │                              ├─7. Unpack Data
     │                              ├─8. Convert to JSON
     │                              └─9. Send to MQTT/API
```

### Packet Validation Flow
```
Received Packet
       │
       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Check Packet    │───▶│ Verify CRC-16   │───▶│ Process Data    │
│ Size = 9  bytes │    │ Checksum        │    │ Send to Server  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       
       ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐             
│ Wrong Size      │    │ CRC Failed      │             
│ Try JSON Parse  │    │ Discard Packet  │             
└─────────────────┘    └─────────────────┘             
```

## Usage

### Sensor Unit (Transmitter)
```cpp
#include "BinaryProtocol.h"

// In loop():
uint8_t binaryData[BINARY_PACKET_SIZE];
if (packSensorData("001", distance, temperature, batteryLevel, binaryData)) {
    LoRa.beginPacket();
    LoRa.write(binaryData, BINARY_PACKET_SIZE);
    LoRa.endPacket();
}
```

### Gateway Unit (Receiver)
```cpp
void onReceive(int packetSize) {
    if (packetSize == BINARY_PACKET_SIZE) {
        uint8_t buffer[BINARY_PACKET_SIZE];
        for (int i = 0; i < packetSize; i++) {
            buffer[i] = LoRa.read();
        }
        
        uint16_t deviceId;
        float distance, temperature;
        uint8_t battery;
        uint32_t timestamp;
        
        if (unpackSensorData(buffer, deviceId, distance, temperature, battery, timestamp)) {
            // Data is valid - process it
            String json = binaryToJSON(deviceId, distance, temperature, battery);
            // Send to MQTT/API
        }
    }
}
```

## Benefits

1. **Reduced Airtime**: 74% smaller packets = faster transmission
2. **Better Range**: Smaller packets have higher success rate
3. **Error Detection**: CRC prevents processing of corrupted data
4. **Backward Compatible**: Can handle both JSON and binary packets
5. **Power Efficient**: Less transmission time = lower power consumption

## Size Comparison Chart

```
Data Format Comparison:
┌─────────────────────────────────────────────────────────────┐
│ JSON: {"i":"001","d":54.32,"t":26.78,"b":75}                │
│ Size: 35 bytes                                              │
│ ████████████████████████████████████                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Binary: [9 bytes with CRC]                                  │
│ Size: 9 bytes                                               │
│ █████████                                                   │
└─────────────────────────────────────────────────────────────┘

Space Saved: 26 bytes (74.3% reduction)
```

## Real-World Example

### Example Data Transmission
```
Original JSON:
{"i":"001","d":123.45,"t":26.78,"b":85}

Binary Representation (Hex):
01 00 35 30 76 0A 55 A3 21

Breakdown:
├── 01 00        → Device ID: 1
├── 35 30        → Distance: 12345 (123.45 * 100)
├── 76 0A        → Temperature: 2678 (26.78 * 100)
├── 55           → Battery: 85%
└── A3 21        → CRC-16 Checksum

Verification:
✓ Packet size: 9 bytes
✓ CRC valid: 0x21A3
✓ Data integrity: 100%
```

## Testing

Use the test file to verify the implementation:
```bash
# Upload BinaryProtocolTest.ino to any ESP32
# Check Serial Monitor for test results
```

Expected output:
```
Binary Protocol Test
===================
Original Data:
Device ID: 001
Distance: 123.45 cm
Temperature: 26.78 °C
Battery: 85%

✓ Data packed successfully
Binary data (9 bytes): 01 00 35 30 6E 0A 55 XX XX

✓ Data unpacked and CRC verified successfully
...
Size reduction: 74.3%
✓ CRC error detection working correctly
```

## Configuration

The binary protocol is automatically included when you add:
```cpp
#include "BinaryProtocol.h"
```

No additional configuration needed - the system maintains backward compatibility with existing JSON format.
