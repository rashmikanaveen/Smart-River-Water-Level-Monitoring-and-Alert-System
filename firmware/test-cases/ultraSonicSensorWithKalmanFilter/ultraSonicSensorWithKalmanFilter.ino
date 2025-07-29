#include <OneWire.h>
#include <DallasTemperature.h>

#define echoPin 18
#define trigPin 5
//#define tempPin 4

// JSN-SR04T specific constants
const float SENSOR_HEIGHT = 200.0; // Height of sensor above riverbed (cm)
const float MIN_WATER_LEVEL = 200.0; // Minimum expected water level (cm)
const float MAX_WATER_LEVEL = 590.0; // Maximum expected water level (cm)
const float MIN_DISTANCE = 25.0; // JSN-SR04T minimum distance (25cm)
const float MAX_DISTANCE = 600.0; // JSN-SR04T maximum distance (6m)

//OneWire oneWire(tempPin);
//DallasTemperature tempSensor(&oneWire);

class WaterLevelKalman {
private:
    float Q, R, P, K, X;
    float lastGoodMeasurement;
    unsigned long lastUpdateTime;
    int consecutiveInvalidReadings;
    
public:
    WaterLevelKalman() {
        Q = 0.1;   
        R = 2.0;   
        P = 10.0;  
        X = SENSOR_HEIGHT / 2; 
        lastGoodMeasurement = X;
        lastUpdateTime = millis();
        consecutiveInvalidReadings = 0;
    }
    
    float updateWaterLevel(float sensorDistance) {
        // Convert sensor distance to water level
        float waterLevel = SENSOR_HEIGHT - sensorDistance;
        
        // Enhanced validation for JSN-SR04T
        bool isValidDistance = (sensorDistance >= MIN_DISTANCE && sensorDistance <= MAX_DISTANCE);
        bool isValidWaterLevel = (waterLevel >= MIN_WATER_LEVEL && waterLevel <= MAX_WATER_LEVEL);
        
        if (isValidDistance && isValidWaterLevel) {
            // Valid measurement - apply Kalman filter
            P = P + Q;
            K = P / (P + R);
            X = X + K * (waterLevel - X);
            P = (1 - K) * P;
            
            lastGoodMeasurement = X;
            lastUpdateTime = millis();
            consecutiveInvalidReadings = 0;
            return X;
        } else {
            // Invalid measurement
            consecutiveInvalidReadings++;
            
            // If too many consecutive invalid readings, reset filter
            if (consecutiveInvalidReadings > 10) {
                resetFilter();
                consecutiveInvalidReadings = 0;
            }
            
            return lastGoodMeasurement;
        }
    }
    
    void resetFilter() {
        P = 10.0;
        X = SENSOR_HEIGHT / 2;
        lastGoodMeasurement = X;
    }
    
    float getCurrentLevel() { return X; }
    float getKalmanGain() { return K; }
    bool isStable() { return K < 0.05; }
    int getInvalidCount() { return consecutiveInvalidReadings; }
};

WaterLevelKalman waterFilter;

// JSN-SR04T specific measurement function
float getJSNDistance() {
    // JSN-SR04T needs longer trigger pulse and timeout
    digitalWrite(trigPin, LOW);
    delayMicroseconds(5);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(20); // Longer trigger for JSN-SR04T
    digitalWrite(trigPin, LOW);
    
    // Longer timeout for JSN-SR04T (up to 6m range)
    unsigned long duration = pulseIn(echoPin, HIGH, 40000); // 40ms timeout
    
    if (duration == 0) {
        return -1; // Timeout occurred
    }
    
    // Calculate distance using speed of sound (343 m/s at 20°C)
    float distance = (duration * 0.0343) / 2.0;
    
    return distance;
}

// Function to get multiple readings and return median for JSN-SR04T
float getMedianDistance(int samples = 3) {
    float readings[samples];
    int validReadings = 0;
    
    for (int i = 0; i < samples; i++) {
        float distance = getJSNDistance();
        
        if (distance > 0 && distance >= MIN_DISTANCE && distance <= MAX_DISTANCE) {
            readings[validReadings] = distance;
            validReadings++;
        }
        
        delay(100); // JSN-SR04T needs more time between readings
    }
    
    if (validReadings == 0) {
        return -1; // No valid readings
    }
    
    // Sort readings to find median
    for (int i = 0; i < validReadings - 1; i++) {
        for (int j = 0; j < validReadings - i - 1; j++) {
            if (readings[j] > readings[j + 1]) {
                float temp = readings[j];
                readings[j] = readings[j + 1];
                readings[j + 1] = temp;
            }
        }
    }
    
    // Return median
    return readings[validReadings / 2];
}

void setup() {
    pinMode(trigPin, OUTPUT); 
    pinMode(echoPin, INPUT);  
    Serial.begin(115200);
    delay(2000); // Give JSN-SR04T time to initialize
    
    Serial.println("JSN-SR04T Water Level Monitoring with Kalman Filter");
    Serial.println("===================================================");
    Serial.println("Time(s)\tTemp(°C)\tRaw Distance(cm)\tFiltered Distance(cm)\tWater Level(cm)\tStatus\t\tGain");
    
    // Test sensor connectivity
    Serial.println("Testing JSN-SR04T sensor...");
    float testDist = getJSNDistance();
    if (testDist > 0) {
        Serial.print("Sensor OK - Initial reading: ");
        Serial.print(testDist);
        Serial.println(" cm");
    } else {
        Serial.println("Warning: No response from sensor!");
    }
    Serial.println("Starting measurements...");
}

void loop() {
    float temperature = 25.0; // Simulated temperature
    
    // Get single raw reading for comparison
    float rawDistance = getJSNDistance();
    
    // Get median distance from multiple readings
    float filteredDistance = getMedianDistance(3);
    
    if (filteredDistance < 0) {
        Serial.print(millis()/1000);
        Serial.print("\t");
        Serial.print(temperature, 1);
        Serial.print("\t");
        Serial.print("NO_ECHO");
        Serial.print("\t\t\t");
        Serial.print("NO_ECHO");
        Serial.print("\t\t\t");
        Serial.print(waterFilter.getCurrentLevel(), 2);
        Serial.print("\t\t");
        Serial.print("ERROR");
        Serial.print("\t\t");
        Serial.println(waterFilter.getKalmanGain(), 4);
        
        delay(2000);
        return;
    }
    
    // Update water level with Kalman filter
    float waterLevel = waterFilter.updateWaterLevel(filteredDistance);
    
    // Print results with detailed information
    Serial.print(millis()/1000);
    Serial.print("\t");
    Serial.print(temperature, 1);
    Serial.print("\t\t");
    Serial.print(rawDistance, 2);
    Serial.print("\t\t\t");
    Serial.print(filteredDistance, 2);
    Serial.print("\t\t\t");
    Serial.print(waterLevel, 2);
    Serial.print("\t\t");
    
    if (waterFilter.isStable()) {
        Serial.print("STABLE");
    } else {
        Serial.print("LEARNING");
    }
    
    Serial.print("\t\t");
    Serial.println(waterFilter.getKalmanGain(), 4);
    
    delay(2000); // JSN-SR04T works better with longer intervals
}