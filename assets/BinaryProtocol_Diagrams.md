# Binary Protocol Visual Diagrams

## System Architecture Diagram

```
                    SMART RIVER WATER LEVEL MONITORING SYSTEM
                                Binary Protocol Implementation

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SENSOR UNIT                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Ultrasonic    │  │   Temperature   │  │     Battery     │  │      ESP32      │     │
│  │     Sensor      │  │     Sensor      │  │    Monitor      │  │   Controller    │     │
│  │   (JSN-SR04T)   │  │   (DS18B20)     │  │   (ADC Read)    │  │   (LoRa TX)     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│           │                     │                     │                     │           │
│           └─────────────────────┼─────────────────────┼─────────────────────┘           │
│                                 │                     │                                 │
│           ┌─────────────────────▼─────────────────────▼─────────────────────┐           │
│           │                 DATA PROCESSING                                 │           │
│           │          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │           │
│           │          │  Median     │ │   Binary    │ │    CRC      │        │           │
│           │          │  Filter     │ │   Packing   │ │ Calculation │        │           │
│           │          └─────────────┘ └─────────────┘ └─────────────┘        │           │
│           └─────────────────────┬───────────────────────────────────────────┘           │
│                                 │                                                       │
│           ┌─────────────────────▼─────────────────────┐                                 │
│           │               LoRa TRANSMITTER            │                                 │
│           │         433MHz, Binary Protocol           │                                 │
│           └─────────────────────┬─────────────────────┘                                 │
└─────────────────────────────────┼───────────────────────────────────────────────────────┘
                                  │
                                  │ LoRa Radio Waves
                                  │ 9-byte Binary Packets
                                  │
┌─────────────────────────────────▼─────────────────────────────────────────────────────────┐
│                                   GATEWAY UNIT                                            │
│           ┌─────────────────────┬─────────────────────┐                                   │
│           │               LoRa RECEIVER               │                                   │
│           │          433MHz, Packet Detection         │                                   │
│           └─────────────────────┬─────────────────────┘                                   │
│                                 │                                                         │
│           ┌─────────────────────▼─────────────────────────────────────────────┐           │
│           │                   PACKET PROCESSING                               │           │
│           │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │           │
│           │  │   Size      │ │    CRC      │ │   Binary    │ │    JSON     │  │           │
│           │  │   Check     │ │ Validation  │ │ Unpacking   │ │ Conversion  │  │           │
│           │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │           │
│           └─────────────────────────────────┬─────────────────────────────────┘           │
│                                             │                                             │
│           ┌─────────────────────────────────▼─────────────────────────────────┐           │     
│           │             ┌─────────▼────────┐  ┌─────────────────┐             │           │
│           │             │      ESP32       │  │      WiFi       │             │           │
│           │             │   Controller     │  │   Connection    │             │           │
│           │             │   (Data Proc)    │  │                 │             │           │
│           │             └──────────────────┘  └─────────────────┘             │           │
│           │                                                                   │           │
│           └─────────────────────────────────┼─────────────────────────────────┘           │
│                                             │                                             │
└─────────────────────────────────────────────┼─────────────────────────────────────────────┘
                                              │          
                                              │ JSON over MQTT
                                              │         
┌─────────────────────────────────────────────▼───────────────────────────────────────────┐
│                                CLOUD SERVICES                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   MQTT Broker   │  │   FastAPI       │  │    Database     │  │   Web Frontend  │     │
│  │  (HiveMQ/AWS)   │  │    Backend      │  │   (PostgreSQL)  │  │   (Next.js)     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Binary Protocol Data Flow

```
BINARY PROTOCOL DATA TRANSFORMATION PIPELINE
═══════════════════════════════════════════════

Step 1: Sensor Data Collection
┌─────────────────────────────────────────────────────────────────┐
│  Raw Sensor Values                                              │
│  ├── Distance: 54.32 cm (float)                                 │
│  ├── Temperature: 26.78°C (float)                               │
│  ├── Battery: 75% (int)                                         │
│  └── Device ID: "001" (string)                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 2: Data Type Conversion
┌─────────────────────────────────────────────────────────────────┐
│  Fixed-Point Integer Conversion                                 │
│  ├── Device ID: "001" → 1 (uint16_t)                            │
│  ├── Distance: 54.32 → 5432 (uint16_t * 100, unsigned)          │
│  ├── Temperature: 26.78 → 2678 (int16_t * 100, signed)          │
│  └── Battery: 75 → 75 (uint8_t)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 3: Binary Structure Packing
┌───────────────────────────────────────────────────────────────┐
│  Memory Layout (9 bytes)                                      │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐                                 │
│  │01│00│3A│15│76│0A│4B│XX│XX│                                 │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┘                                 │
│   ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲──▲                                   │
│   │  │  │  │  │  │  │  │  │                                   │
│   │  │  │  │  │  │  │  │  └─CRC-16 High                       │
│   │  │  │  │  │  │  │  └─CRC-16 Low                           │
│   │  │  │  │  │  │  └─Battery Level                           │
│   │  │  │  │  └──┴─Temperature (signed)                       │
│   │  │  └──┴─Distance (unsigned)                              │
│   └──┴─Device ID                                              │
└─────────────────────────────────────────┼─────────────────────┘
                                │
                                ▼
Step 4: CRC-16 Calculation
┌──────────────────────────────────────────────────────────────┐
│  Error Detection Checksum                                    │
│  Input: Bytes 0-6 (7 bytes of data)                          │
│  Algorithm: CRC-16 CCITT (Polynomial: 0x1021)                │
│  Output: 2-byte checksum → Bytes 7-8                         │
└──────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 5: LoRa Transmission
┌───────────────────────────────────────────────────────────────┐
│  Radio Transmission                                           │
│  ├── Frequency: 433MHz                                        │
│  ├── Packet Size: 9 bytes                                     │
│  ├── Transmission Time: ~12ms                                 │
│  └── Power Consumption: Minimal (small packet)                │
└───────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 6: Gateway Reception & Validation
┌──────────────────────────────────────────────────────────────┐
│  Packet Validation Pipeline                                  │
│  ├── Size Check: packet.size == 9 bytes ✓                    │
│  ├── CRC Verification: calculated == received ✓              │
│  ├── Data Unpacking: binary → structured data ✓              │
│  └── JSON Conversion: for MQTT/API compatibility ✓           │
└──────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 7: Cloud Service Integration
┌──────────────────────────────────────────────────────────────┐
│  Final JSON Output                                           │
│  {"i":"001","d":54.32,"t":26.78,"b":75,"ts":123456789}       │
│  ├── MQTT: Topic "Distance", "Temperature", "Battery"        │
│  ├── Database: Store with timestamp                          │
│  └── Web App: Real-time display                              │
└──────────────────────────────────────────────────────────────┘
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
    │ Size =  │ ────────▶ │ Try JSON Parse │
    │9 bytes? │           │ (Compatibility) │
    └─────────┘           └─────────────────┘
         │ YES
         ▼
    ┌─────────┐
    │ Read 9  │
    │ Bytes   │
    │ Buffer  │
    └─────────┘
         │
         ▼
    ┌─────────┐
    │Calculate│     NO    ┌─────────────────┐
    │CRC from │ ────────▶ │ Discard Packet  │
    │Bytes0-6 │           │ Log Error       │
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

BINARY PROTOCOL DETAILED SPECIFICATION
══════════════════════════════════════

Byte Structure (9 bytes total):
┌───────────────────────────────────────────────────────────────────────┐
│                            HEADER SECTION                             │
├───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┤
│Bit│ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ 1 │ 0 │ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ 1 │ 0 │...│
├───┼───┴───┴───┴───┴───┴───┴───┴───┼───┴───┴───┴───┴───┴───┴───┴───┼───┤
│B0 │        Device ID (Low)        │B1 │      Device ID (High)     │   │
├───┼───────────────────────────────┼───┼───────────────────────────┼───┤
│B2 │    Distance (Low, unsigned)   │B3 │  Distance (High, unsigned)│   │
├───┼───────────────────────────────┼───┼───────────────────────────┼───┤
│B4 │   Temperature (Low, signed)   │B5 │ Temperature (High, signed)│   │
├───┼───────────────────────────────┼───┼───────────────────────────┼───┤
│B6 │       Battery Level           │B7 │        CRC Low            │   │
├───┼───────────────────────────────┼───┼───────────────────────────┼───┤
│B8 │        CRC High               │   │                           │   │
└───┴───────────────────────────────┴───┴───────────────────────────┴───┘

Data Type Specifications:
┌─────────────────┬──────────────┬─────────────┬─────────────────────────┐
│ Field           │ Size (bytes) │ Type        │ Description             │
├─────────────────┼──────────────┼─────────────┼─────────────────────────┤
│ Device ID       │      2       │ uint16_t    │ Sensor unit identifier  │
│ Distance        │      2       │ uint16_t    │ Distance * 100 (cm), unsigned │
│ Temperature     │      2       │ int16_t     │ Temperature * 100 (°C), signed │
│ Battery Level   │      1       │ uint8_t     │ Battery percentage      │ 
│ CRC-16          │      2       │ uint16_t    │ Error detection         │
├─────────────────┼──────────────┼─────────────┼─────────────────────────┤
│ TOTAL           │      9       │             │ Complete packet size    │
└─────────────────┴──────────────┴─────────────┴─────────────────────────┘

Endianness: Little Endian (LSB first)
CRC Algorithm: CRC-16 CCITT (Polynomial: 0x1021, Initial: 0xFFFF)
```
