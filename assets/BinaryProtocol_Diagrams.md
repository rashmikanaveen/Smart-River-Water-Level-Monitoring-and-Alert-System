# Binary Protocol Visual D           ┌──           ┌─────────────────────┬─────────────────────┐                                  │
           │               LoRa RECEIVER              │                                  │
           │          433MHz, Packet Detection        │                                  │
           └─────────────────────┬─────────────────────┘                                  │───────────────▼─────────────────────┐                                  │
           │               LoRa TRANSMITTER            │                                  │
           │         433MHz, Binary Protocol          │                                  │
           └─────────────────────┬─────────────────────┘                                  │ams

## System Architecture Diagram

```
                    SMART RIVER WATER LEVEL MONITORING SYSTEM
                                Binary Protocol Implementation

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SENSOR UNIT                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Ultrasonic    │  │   Temperature   │  │     Battery     │  │      ESP32      │      │
│  │     Sensor      │  │     Sensor      │  │    Monitor      │  │   Controller    │      │
│  │   (JSN-SR04T)   │  │   (DS18B20)     │  │   (ADC Read)    │  │   (LoRa TX)     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│           │                     │                     │                     │            │
│           └─────────────────────┼─────────────────────┼─────────────────────┘            │
│                                 │                     │                                  │
│           ┌─────────────────────▼─────────────────────▼─────────────────────┐            │
│           │                 DATA PROCESSING                                │            │
│           │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │            │
│           │  │   Kalman    │ │  Median     │ │   Binary    │ │    CRC      │ │            │
│           │  │   Filter    │ │  Filter     │ │   Packing   │ │ Calculation │ │            │
│           │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │            │
│           └─────────────────────┬─────────────────────────────────────────────┘            │
│                                 │                                                        │
│           ┌─────────────────────▼─────────────────────┐                                  │
│           │               LoRa TRANSMITTER            │                                  │
│           │         915MHz, Binary Protocol          │                                  │
│           └─────────────────────┬─────────────────────┘                                  │
└─────────────────────────────────┼─────────────────────────────────────────────────────────┘
                                  │
                                  │ LoRa Radio Waves
                                  │ 13-byte Binary Packets
                                  │
┌─────────────────────────────────▼─────────────────────────────────────────────────────────┐
│                                   GATEWAY UNIT                                          │
│           ┌─────────────────────┬─────────────────────┐                                  │
│           │               LoRa RECEIVER              │                                  │
│           │          915MHz, Packet Detection        │                                  │
│           └─────────────────────┬─────────────────────┘                                  │
│                                 │                                                        │
│           ┌─────────────────────▼─────────────────────────────────────────────┐            │
│           │                 PACKET PROCESSING                               │            │
│           │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │            │
│           │  │   Size      │ │    CRC      │ │   Binary    │ │    JSON     │ │            │
│           │  │   Check     │ │ Validation  │ │ Unpacking   │ │ Conversion  │ │            │
│           │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │            │
│           └─────────────────────┬─────────────────────────────────────────────┘            │
│                                 │                                                        │
│  ┌─────────────────┐  ┌─────────▼─────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │    NB-IoT       │  │      ESP32       │  │      WiFi       │  │    Ethernet     │      │
│  │   (EC-01)       │  │   Controller     │  │   Connection    │  │   Connection    │      │
│  │                 │  │   (Data Proc)    │  │                 │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│           │                     │                     │                     │            │
│           └─────────────────────┼─────────────────────┼─────────────────────┘            │
│                                 │                     │                                  │
└─────────────────────────────────┼─────────────────────┼─────────────────────────────────┘
                                  │                     │
                                  │ JSON over MQTT      │ JSON over HTTP
                                  │                     │
┌─────────────────────────────────▼─────────────────────▼─────────────────────────────────┐
│                                CLOUD SERVICES                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   MQTT Broker   │  │   FastAPI       │  │    Database     │  │   Web Frontend  │      │
│  │  (HiveMQ/AWS)   │  │    Backend      │  │   (PostgreSQL)  │  │   (Next.js)     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Binary Protocol Data Flow

```
BINARY PROTOCOL DATA TRANSFORMATION PIPELINE
═══════════════════════════════════════════════

Step 1: Sensor Data Collection
┌─────────────────────────────────────────────────────────────────┐
│  Raw Sensor Values                                              │
│  ├── Distance: 54.32 cm (float)                                │
│  ├── Temperature: 26.78°C (float)                              │
│  ├── Battery: 75% (int)                                        │
│  └── Device ID: "001" (string)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 2: Data Type Conversion
┌─────────────────────────────────────────────────────────────────┐
│  Fixed-Point Integer Conversion                                 │
│  ├── Device ID: "001" → 1 (uint16_t)                          │
│  ├── Distance: 54.32 → 5432 (uint16_t * 100)                 │
│  ├── Temperature: 26.78 → 2678 (uint16_t * 100)              │
│  ├── Battery: 75 → 75 (uint8_t)                               │
│  └── Timestamp: millis() → 123456789 (uint32_t)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 3: Binary Structure Packing
┌─────────────────────────────────────────────────────────────────┐
│  Memory Layout (13 bytes)                                      │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                      │
│  │01│00│3A│15│76│0A│4B│15│CD│5B│07│XX│XX│                      │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                      │
│   ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲───────────▲  ▲──▲                    │
│   │  │  │  │  │  │  │  │           │  │  │                    │
│   │  │  │  │  │  │  │  └─Timestamp─┘  │  └─CRC-16              │
│   │  │  │  │  │  │  └─Battery          │                       │
│   │  │  │  │  └──┴─Temperature         │                       │
│   │  │  └──┴─Distance                  │                       │
│   └──┴─Device ID                       │                       │
└─────────────────────────────────────────┼─────────────────────────┘
                                │
                                ▼
Step 4: CRC-16 Calculation
┌─────────────────────────────────────────────────────────────────┐
│  Error Detection Checksum                                      │
│  Input: Bytes 0-10 (11 bytes of data)                         │
│  Algorithm: CRC-16 CCITT (Polynomial: 0x1021)                 │
│  Output: 2-byte checksum → Bytes 11-12                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 5: LoRa Transmission
┌─────────────────────────────────────────────────────────────────┐
│  Radio Transmission                                            │
│  ├── Frequency: 433MHz                                        │
│  ├── Packet Size: 13 bytes                                    │
│  ├── Transmission Time: ~15ms                                 │
│  └── Power Consumption: Minimal (small packet)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 6: Gateway Reception & Validation
┌─────────────────────────────────────────────────────────────────┐
│  Packet Validation Pipeline                                    │
│  ├── Size Check: packet.size == 13 bytes ✓                   │
│  ├── CRC Verification: calculated == received ✓               │
│  ├── Data Unpacking: binary → structured data ✓              │
│  └── JSON Conversion: for MQTT/API compatibility ✓            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 7: Cloud Service Integration
┌─────────────────────────────────────────────────────────────────┐
│  Final JSON Output                                             │
│  {"i":"001","d":54.32,"t":26.78,"b":75,"ts":123456789}       │
│  ├── MQTT: Topic "Distance", "Temperature", "Battery"         │
│  ├── Database: Store with timestamp                           │
│  └── Web App: Real-time display                               │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow Chart

```
PACKET RECEPTION & ERROR HANDLING
═════════════════════════════════

LoRa Packet Received
         │
         ▼
    ┌─────────┐
    │ Packet  │     NO    ┌─────────────────┐
    │ Size =  │ ────────▶ │ Try JSON Parse  │
    │13 bytes?│           │ (Compatibility) │
    └─────────┘           └─────────────────┘
         │ YES
         ▼
    ┌─────────┐
    │ Read 13 │
    │ Bytes   │
    │ Buffer  │
    └─────────┘
         │
         ▼
    ┌─────────┐
    │Calculate│     NO    ┌─────────────────┐
    │CRC from │ ────────▶ │ Discard Packet  │
    │Bytes0-10│           │ Log Error       │
    └─────────┘           └─────────────────┘
         │ CRC Valid
         ▼
    ┌─────────┐
    │ Unpack  │
    │ Binary  │
    │ Data    │
    └─────────┘
         │
         ▼
    ┌─────────┐
    │Convert  │
    │ to JSON │
    │& Send   │
    └─────────┘
         │
         ▼
    ┌─────────┐
    │Success! │
    │Data     │
    │Processed│
    └─────────┘
```

## Bit-Level Protocol Specification

```
BINARY PROTOCOL DETAILED SPECIFICATION
══════════════════════════════════════

Byte Structure (13 bytes total):
┌───────────────────────────────────────────────────────────────────────────────┐
│                            HEADER SECTION                                    │
├───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┤
│Bit│ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ 1 │ 0 │ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ 1 │ 0 │...│
├───┼───┴───┴───┴───┴───┴───┴───┴───┼───┴───┴───┴───┴───┴───┴───┴───┼───┤
│B0 │        Device ID (Low)        │B1 │      Device ID (High)      │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B2 │       Distance (Low)          │B3 │      Distance (High)       │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B4 │     Temperature (Low)         │B5 │    Temperature (High)      │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B6 │       Battery Level           │B7 │     Timestamp Byte 0       │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B8 │     Timestamp Byte 1          │B9 │     Timestamp Byte 2       │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B10│     Timestamp Byte 3          │B11│        CRC Low             │   │
├───┼───────────────────────────────┼───┼─────────────────────────────┼───┤
│B12│        CRC High               │   │                             │   │
└───┴───────────────────────────────┴───┴─────────────────────────────┴───┘

Data Type Specifications:
┌─────────────────┬──────────────┬─────────────┬─────────────────────────┐
│ Field           │ Size (bytes) │ Type        │ Description             │
├─────────────────┼──────────────┼─────────────┼─────────────────────────┤
│ Device ID       │      2       │ uint16_t    │ Sensor unit identifier  │
│ Distance        │      2       │ uint16_t    │ Distance * 100 (cm)     │
│ Temperature     │      2       │ uint16_t    │ Temperature * 100 (°C)  │
│ Battery Level   │      1       │ uint8_t     │ Battery percentage      │
│ Timestamp       │      4       │ uint32_t    │ Milliseconds since boot │
│ CRC-16          │      2       │ uint16_t    │ Error detection         │
├─────────────────┼──────────────┼─────────────┼─────────────────────────┤
│ TOTAL           │     13       │             │ Complete packet size    │
└─────────────────┴──────────────┴─────────────┴─────────────────────────┘

Endianness: Little Endian (LSB first)
CRC Algorithm: CRC-16 CCITT (Polynomial: 0x1021, Initial: 0xFFFF)
```
