# Smart-River-Water-Level-Monitoring-and-Alert-System
Affordable, maintainable river water level gauge with Alert System


![System Architecture](assets/system-higiLevel_architecture.png)

This project presents a cost-effective and maintainable river water level monitoring and alert system. It is specifically designed for deployment in remote or rural areas where conventional solutions are too expensive, require complex maintenance, or rely heavily on satellite communication.

The system uses a combination of low-power hardware and modern wireless communication technologies to continuously monitor water levels and issue alerts when thresholds are exceeded.

---

## Problem Statement

In many rural regions, communities suffer from a lack of early warning systems for floods or droughts. Manual monitoring is inefficient and unreliable, and existing systems are often:

- Too expensive
- Dependent on strong internet connectivity
- Complex to maintain and operate

---

## Objectives

- Measure river water levels in real time  
- Show the current water level relative to a defined normal level  
- Provide alerts when water levels reach critical thresholds  
- Log and visualize data on a cloud dashboard  
- Ensure the system is low-power and suitable for remote deployments  
- Maintain a low-cost, easy-to-maintain design  

---

## Solution Overview


- **Sensor Unit**: Ultrasonic sensor mounted facing the river to measure water levels based on distance  
- **Microcontroller**: ESP32 reads sensor data and manages communication  
- **Communication Module**: Data sent via LoRa or Cellular, depending on availability  
- **Cloud Integration**: Real-time data uploaded for monitoring and analytics  
- **Alert System**: Threshold-based alerts (LOW, MEDIUM, HIGH) via web application and buzzer  

---

## Deployment Scenario

The system is installed beside a river or on a bridge, with the ultrasonic sensor facing downward toward the water surface. The MCU reads the water level and temperature sensor data using one or two Sensors then get calculate average from that  multiple readings for accuracy, and applies temperature correction.

Data is transmitted using the LoRa protocol to a central MCU(ESP32), which then connects to Wi-Fi and sends the data to the server using MQTT. The server processes the data, visualizes it, and sends notifications to users.

The device is battery-powered for off-grid use, enclosed in a weatherproof housing. Future versions include a solar panel for sustainable charging.

---

## Key Features

- Real-time water level monitoring  
- Cloud dashboard integration  
- Alert system for flood and overflow conditions  
- Energy-efficient and robust for outdoor use  
- Cost-effective and easy to deploy  

---

## Impact

- Improve preparedness for water-related disasters in rural areas  
- Enable remote monitoring and early warning systems  
- Reduce costs compared to traditional telemetry or satellite-based systems  

---

## Project Setup Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **Python** (3.9 or higher) - [Download](https://www.python.org/)
- **PostgreSQL** (14 or higher) - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rashmikanaveen/Smart-River-Water-Level-Monitoring-and-Alert-System.git
cd Smart-River-Water-Level-Monitoring-and-Alert-System
```

---

### 2. Database Setup (PostgreSQL)

#### Step 1: Install PostgreSQL

**Windows:**
- Download and install from [PostgreSQL Official Site](https://www.postgresql.org/download/windows/)
- During installation, remember the password you set for the `postgres` user

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### Step 2: Create Database and User

Open PostgreSQL command line:

**Windows:**
```bash
psql -U postgres
```

**Linux/macOS:**
```bash
sudo -u postgres psql
```

Run the following SQL commands:

```sql
-- Create database
CREATE DATABASE river_monitoring;

-- Create user (change password to your preference)
CREATE USER river_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE river_monitoring TO river_user;

-- Connect to the database
\c river_monitoring

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO river_user;

-- Exit
\q
```

#### Step 3: Create Database Tables

The application uses SQLAlchemy ORM, but you can create tables manually if needed:

```sql
-- Connect to database
psql -U river_user -d river_monitoring

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sensor_data table (adjust based on your needs)
CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    unit_id VARCHAR(10) NOT NULL,
    distance FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    battery_level INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_level VARCHAR(20)
);

-- Create units table for sensor configuration
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    unit_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100),
    warning_level FLOAT,
    high_level FLOAT,
    critical_level FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_averages table
CREATE TABLE daily_averages (
    id SERIAL PRIMARY KEY,
    unit_id VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    avg_distance FLOAT,
    avg_temperature FLOAT,
    avg_battery FLOAT,
    UNIQUE(unit_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_sensor_data_unit_id ON sensor_data(unit_id);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_daily_averages_unit_date ON daily_averages(unit_id, date);

-- Exit
\q
```

---

### 3. Backend Setup (FastAPI)

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Windows
type nul > .env

# Linux/macOS
touch .env
```

Add the following configuration to `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://river_user:your_secure_password@localhost:5432/river_monitoring

# MQTT Broker Configuration
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
MQTT_TOPIC_DISTANCE=Distance
MQTT_TOPIC_TEMP=Temperature
MQTT_TOPIC_BATTERY=Battery

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CORS Origins (for frontend)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Secret Key (generate a secure key)
SECRET_KEY=your-secret-key-here-change-this-in-production
```

#### Step 5: Initialize Database Tables

```bash
# Run the FastAPI app once to create tables
python -m app.main
```

Or create a migration script if using Alembic (optional):

```bash
# Install Alembic
pip install alembic

# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

#### Step 6: Run the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

### 4. Frontend Setup (Next.js)

#### Step 1: Navigate to Frontend Directory

Open a new terminal window:

```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### Step 3: Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Windows
type nul > .env.local

# Linux/macOS
touch .env.local
```

Add the following configuration to `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Optional: Analytics, etc.
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

#### Step 4: Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The frontend will be available at:
- **Web App**: http://localhost:3000

---

### 5. Firmware Setup (ESP32/Arduino)

#### Step 1: Install PlatformIO

**VS Code Extension (Recommended):**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "PlatformIO IDE"
4. Click Install

**Or install CLI:**
```bash
pip install platformio
```

#### Step 2: Configure Sensor Unit

Navigate to sensor unit:
```bash
cd firmware/sensor-unit
```

Update `src/config.h` with your settings:

```cpp
// LoRa Configuration
#define LORA_FREQUENCY 433E6  // 433MHz (adjust to your frequency)
#define LORA_TX_POWER 20      // Transmission power

// Sensor Configuration
#define UNIT_ID "001"         // Unique sensor unit ID

// Pin Definitions
#define LORA_SS_PIN 5
#define LORA_RST_PIN 14
#define LORA_DIO0_PIN 2
```

#### Step 3: Upload Sensor Firmware

```bash
# Build
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

#### Step 4: Configure Gateway Unit

Navigate to gateway unit:
```bash
cd firmware/gateway-unit
```

Update `src/config.h` with your WiFi and MQTT settings:

```cpp
// WiFi Configuration
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// MQTT Configuration
#define MQTT_BROKER "broker.hivemq.com"
#define MQTT_PORT 1883
```

#### Step 5: Upload Gateway Firmware

```bash
# Build and upload
pio run --target upload

# Monitor
pio device monitor
```

---

## Testing the System

### 1. Verify Database Connection

```bash
# Connect to PostgreSQL
psql -U river_user -d river_monitoring

# Check tables
\dt

# Query sensor data
SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 10;
```

### 2. Test Backend API

Visit http://localhost:8000/docs and try:
- `GET /api/sensors` - Get all sensor data
- `GET /api/units` - Get all sensor units
- `POST /api/units` - Create new sensor unit

### 3. Test Frontend

1. Open http://localhost:3000
2. You should see the dashboard
3. Check if real-time data is displayed

### 4. Test MQTT Connection

Use an MQTT client to verify data flow:

```bash
# Install MQTT client
pip install paho-mqtt

# Subscribe to topics
mosquitto_sub -h broker.hivemq.com -t "Distance" -t "Temperature" -t "Battery"
```

---

## Project Structure

```
Smart-River-Water-Level-Monitoring-and-Alert-System/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Configuration
│   │   ├── db/                # Database setup
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities
│   │   └── types/             # TypeScript types
│   ├── package.json           # Node dependencies
│   └── .env.local             # Environment variables
├── firmware/                   # ESP32 Firmware
│   ├── sensor-unit/           # Sensor node code
│   ├── gateway-unit/          # Gateway code
│   └── README_BinaryProtocol.md
└── README.md                  # This file
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
# or
net start postgresql-x64-14       # Windows

# Check connection
psql -U river_user -d river_monitoring -h localhost
```

### Backend Issues

```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000     # Windows
lsof -i :8000                    # Linux/macOS

# Check Python version
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Frontend Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version
```

### MQTT Connection Issues

- Verify broker URL in backend `.env` and firmware `config.h`
- Check firewall settings
- Use public broker like `broker.hivemq.com` for testing

---

## Production Deployment

### Backend (FastAPI)

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Frontend (Next.js)

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Backup

```bash
# Backup database
pg_dump -U river_user -d river_monitoring > backup.sql

# Restore database
psql -U river_user -d river_monitoring < backup.sql
```

---

## API Endpoints

### Sensor Data
- `GET /api/sensors` - Get all sensor readings
- `GET /api/sensors/{unit_id}` - Get specific unit data
- `POST /api/sensors` - Add sensor reading

### Units Management
- `GET /api/units` - List all sensor units
- `POST /api/units` - Create new unit
- `PUT /api/units/{unit_id}` - Update unit configuration
- `DELETE /api/units/{unit_id}` - Delete unit

### WebSocket
- `WS /ws` - Real-time sensor data stream

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Authors

- **Rashmi Kanaveen** - [@rashmikanaveen](https://github.com/rashmikanaveen)

---

## Acknowledgments

- ESP32 Community
- LoRa Alliance
- FastAPI & Next.js Teams




