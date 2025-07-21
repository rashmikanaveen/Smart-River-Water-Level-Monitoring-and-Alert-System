# Smart-River-Water-Level-Monitoring-and-Alert-System
Affordable, maintainable river water level gauge with Alert System


## 🌊 Overview

Traditional water level monitoring systems are often:
- **Expensive**
- **Hard to maintain**
- Dependent on **satellite communication**
- Lacking **on-site display or alerts**

This project aims to solve these limitations by providing a **cost-effective** and **field-deployable** solution using:

- **ESP32 microcontroller**
- **NB-IoT (Narrowband IoT)** communication for low-power cellular data transfer
- **MQTT** protocol for lightweight, real-time data transmission
- **GPS module** for station identification
- **A02YYUW Waterproof Ultrasonic Sensor** for accurate water level measurement
- **Buzzer/Speaker** + **Mobile App** for local and remote alerts

---

## 🎯 Key Features

- ✅ **Low-Cost**: Designed using affordable components
- 🌐 **NB-IoT Communication**: Low power, cellular MQTT transmission
- 📍 **GPS Support**: Identifies each monitoring station/location
- 🌧️ **Waterproof Ultrasonic Sensor**: Reliable measurements even in moist environments
- 📢 **On-site Alerts**: Buzzer or speaker to notify local authorities
- 📱 **Mobile Integration**: View real-time data and receive alerts through a mobile app
- ⚠️ **Flood Alert System**: Sends alerts when water exceeds critical thresholds
- 📊 **Remote Monitoring**: View live water levels remotely

---

## 🧩 System Components

| Component                         | Purpose                                   |
|----------------------------------|-------------------------------------------|
| ESP32                            | Main controller for data processing       |
| A02YYUW Waterproof Ultrasonic    | Measures river water level accurately     |
| NB-IoT Module (e.g., SIM7000G)   | Sends data over cellular MQTT             |
| GPS Module (e.g., NEO-6M/M8N)    | Tags each station with location data      |
| Buzzer or Speaker                | On-site audio alert for high water level  |
| Power Supply (Battery + Solar)  | Supports remote deployment (optional)     |

---

## 🔄 Data Flow

1. **ESP32** reads distance from ultrasonic sensor
2. Calculates current water level compared to normal level
3. If level exceeds critical value, triggers:
   - **Buzzer/Audio alert**
   - **MQTT message** to cloud/app
4. Sends GPS-tagged data packet over NB-IoT using MQTT
5. **Mobile App** or Dashboard receives and displays live water level

---

## 🔧 Technologies Used

- 📶 NB-IoT Module (e.g., SIM7000G / SIM7020)
- 🌐 MQTT Broker (e.g., Mosquitto / Cloud MQTT)
- 📡 GPS Module (NEO-M8N recommended)
- 💧 A02YYUW Ultrasonic Sensor
- ⚡ ESP32 Board (Wi-Fi + Bluetooth + good dev support)
- 📱 Mobile App (future work or integration with platforms like Blynk / custom app)

---

## 📦 Future Enhancements

- 🔋 Solar panel support for long-term power autonomy
- 📈 Historical data logging and trend visualization
- 🗺️ Station mapping and flood zone prediction
- 📲 Push notifications via SMS or app

---

## 📍 Why This Matters

Rural or remote river-side communities often lack access to early warning systems due to the **high cost** and **complexity** of traditional solutions. This project bridges that gap by offering a **smart, affordable, and scalable alternative**.

---

## 💡 License

MIT License — Free to use and modify.
