# Latest Sensor Data Cache - Implementation Documentation

## Overview
This implementation adds a caching layer for the latest MQTT sensor data from all units. When data arrives via MQTT (topic: `lora/water_lavel`), it's stored in memory cache with the last update timestamp, allowing fast retrieval without database queries.

## Architecture Changes

### 1. MQTT Cache Manager (`app/services/mqtt_cache_manager.py`)

#### New Cache Structure
```python
self._latest_sensor_data_cache: Dict[str, Dict] = {}
# Structure: {
#     unit_id: {
#         "distance": float,
#         "temperature": float, 
#         "battery": float,
#         "rssi": int,
#         "snr": float,
#         "last_updated": datetime
#     }
# }
```

#### New Methods Added

1. **`update_latest_sensor_data(unit_id, distance, temperature, battery, rssi, snr)`**
   - Called when MQTT data arrives
   - Updates cache with latest sensor readings
   - Records timestamp of update

2. **`get_latest_sensor_data(unit_id)`**
   - Returns cached data for specific unit
   - Returns None if unit has no cached data

3. **`get_all_latest_sensor_data()`**
   - Returns cached data for all units
   - Returns empty dict if no data available

4. **Updated `clear_cache(unit_id)`**
   - Now also clears latest sensor data cache
   - Supports clearing specific unit or all units

5. **Updated `get_cache_stats()`**
   - Now includes count of units with latest sensor data

### 2. MQTT Service (`app/services/mqtt_service.py`)

#### Changes in `_handle_distance()` method

Added cache update after parsing MQTT message:

```python
# Update latest sensor data cache
mqtt_cache_manager.update_latest_sensor_data(
    unit_id=unit_id,
    distance=height,
    temperature=temperature,
    battery=battery,
    rssi=rssi,
    snr=snr
)
```

This ensures every MQTT message updates the cache with the most recent data.

### 3. New API Endpoints (`app/api/routes.py`)

#### Endpoint 1: Get Latest Data for Specific Unit
```
GET /api/latest-data/{unit_id}
```

**Parameters:**
- `unit_id` (path) - The unit ID to get data for

**Response Example:**
```json
{
    "unit_id": "003",
    "unit_name": "Unit 003",
    "location": "River Station A",
    "sensor_data": {
        "distance": 140.5,
        "temperature": 28.3,
        "battery": 80.0,
        "rssi": -110,
        "snr": 10.0,
        "last_updated": "2025-10-19T14:30:45.123456"
    },
    "alert_levels": {
        "normal": 0.3,
        "warning": 0.5,
        "high": 1.0,
        "critical": 1.5
    },
    "is_active": true
}
```

**Error Responses:**
- `404` - Unit not found or no recent data available
- `500` - Server error

#### Endpoint 2: Get Latest Data for All Units
```
GET /api/latest-data
```

**Response Example:**
```json
{
    "total_units": 3,
    "units": [
        {
            "unit_id": "001",
            "unit_name": "Unit 001",
            "location": "River Station A",
            "sensor_data": {
                "distance": 135.2,
                "temperature": 27.5,
                "battery": 85.0,
                "rssi": -105,
                "snr": 12.0,
                "last_updated": "2025-10-19T14:30:40.123456"
            },
            "alert_levels": {
                "normal": 0.3,
                "warning": 0.5,
                "high": 1.0,
                "critical": 1.5
            },
            "is_active": true
        },
        // ... more units
    ]
}
```

## Data Flow

```
MQTT Message Arrives
    ↓
mqtt_service._handle_distance()
    ↓
mqtt_cache_manager.update_latest_sensor_data()
    ↓
Cache Updated (in-memory)
    ↓
[User Requests Latest Data]
    ↓
GET /api/latest-data/{unit_id}
    ↓
mqtt_cache_manager.get_latest_sensor_data()
    ↓
Return Cached Data with Timestamp
```

## Benefits

1. **Fast Response Times**: Data retrieved from memory cache instead of database
2. **Real-Time Updates**: Cache updates automatically when MQTT data arrives
3. **Last Update Tracking**: Every data point includes timestamp
4. **Low Database Load**: Reduces database queries for latest data
5. **Simple Integration**: RESTful API easy to integrate with frontend

## Usage Examples

### Frontend JavaScript Example

```javascript
// Get latest data for specific unit
async function getLatestUnitData(unitId) {
    const response = await fetch(`http://localhost:8000/api/latest-data/${unitId}`);
    const data = await response.json();
    
    console.log(`Last updated: ${data.sensor_data.last_updated}`);
    console.log(`Distance: ${data.sensor_data.distance}m`);
    console.log(`Temperature: ${data.sensor_data.temperature}°C`);
    console.log(`Battery: ${data.sensor_data.battery}%`);
}

// Get latest data for all units
async function getAllLatestData() {
    const response = await fetch('http://localhost:8000/api/latest-data');
    const data = await response.json();
    
    data.units.forEach(unit => {
        console.log(`${unit.unit_name}: ${unit.sensor_data.distance}m (${unit.sensor_data.last_updated})`);
    });
}
```

### Python Example

```python
import requests

# Get latest data for unit 003
response = requests.get('http://localhost:8000/api/latest-data/003')
data = response.json()

print(f"Unit: {data['unit_name']}")
print(f"Distance: {data['sensor_data']['distance']}m")
print(f"Last Updated: {data['sensor_data']['last_updated']}")
```

## Cache Management

### View Cache Statistics
```
GET /api/cache/stats
```

Returns statistics including count of units with latest sensor data.

### Clear Cache for Specific Unit
```
DELETE /api/cache/clear/{unit_id}
```

Clears all cached data (including latest sensor data) for specific unit.

### Clear All Cache
```
DELETE /api/cache/clear
```

Clears all cached data for all units.

## Testing

### Test with curl

```bash
# Get latest data for unit 003
curl http://localhost:8000/api/latest-data/003

# Get latest data for all units
curl http://localhost:8000/api/latest-data

# Get cache statistics
curl http://localhost:8000/api/cache/stats
```

## Notes

- Cache is stored in memory and will be cleared on server restart
- Data is only available after at least one MQTT message has been received
- Only active units are included in the "all units" response
- Timestamps are in ISO 8601 format with timezone information
- Cache automatically updates when new MQTT messages arrive

## Future Enhancements

Possible improvements:
1. Add cache expiration (clear old data after X minutes of no updates)
2. Persist cache to Redis for multi-instance deployments
3. Add data validation and anomaly detection
4. Include historical comparison (current vs previous reading)
5. Add WebSocket endpoint for real-time updates
