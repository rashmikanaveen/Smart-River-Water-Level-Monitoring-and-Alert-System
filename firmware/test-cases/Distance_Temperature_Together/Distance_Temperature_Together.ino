#include <OneWire.h>
#include <DallasTemperature.h>

#define echoPin 25
#define trigPin 33
//#define tempPin 4

// JSN-SR04T constants - DISTANCE ONLY
const float MIN_DISTANCE = 30.0; // JSN-SR04T minimum distance (30cm)
const float MAX_DISTANCE = 570.0; // JSN-SR04T maximum distance (5.7m)

//OneWire oneWire(tempPin);
//DallasTemperature tempSensor(&oneWire);

class ImprovedDistanceKalman {
private:
    float Q, R, P, K, X;
    float lastGoodMeasurement;
    unsigned long lastUpdateTime;
    int consecutiveInvalidReadings;
    float innovation; // Innovation (measurement residual)
    int measurementCount;
    
public:
    ImprovedDistanceKalman() {
        // TUNED parameters for JSN-SR04T
        Q = 0.05;  // Lower process noise - distances change slowly
        R = 1.5;   // Lower measurement noise - JSN-SR04T is quite accurate
        P = 5.0;   // Lower initial uncertainty
        X = 300.0; // Better initial estimate (3m)
        lastGoodMeasurement = X;
        lastUpdateTime = millis();
        consecutiveInvalidReadings = 0;
        innovation = 0.0;
        measurementCount = 0;
    }
    
    float updateDistance(float rawDistance) {
        // Enhanced validation with trend checking
        bool isValidDistance = (rawDistance >= MIN_DISTANCE && rawDistance <= MAX_DISTANCE);
        
        // Check for reasonable change rate (max 50cm change per second)
        unsigned long currentTime = millis();
        float timeDiff = (currentTime - lastUpdateTime) / 1000.0; // seconds
        float maxChange = 50.0 * timeDiff; // 50cm/s max change
        
        bool isReasonableChange = true;
        if (measurementCount > 0) {
            float changeMagnitude = abs(rawDistance - lastGoodMeasurement);
            isReasonableChange = (changeMagnitude <= maxChange || timeDiff > 5.0);
        }
        
        if (isValidDistance && isReasonableChange) {
            // Calculate innovation
            innovation = rawDistance - X;
            
            // Adaptive noise based on innovation
            if (abs(innovation) > 20.0) {
                // Large innovation - increase measurement noise temporarily
                R = 3.0;
            } else if (abs(innovation) < 5.0) {
                // Small innovation - trust measurement more
                R = 1.0;
            } else {
                R = 1.5; // Default
            }
            
            // Kalman filter equations
            P = P + Q;
            K = P / (P + R);
            X = X + K * innovation;
            P = (1 - K) * P;
            
            lastGoodMeasurement = X;
            lastUpdateTime = currentTime;
            consecutiveInvalidReadings = 0;
            measurementCount++;
            return X;
        } else {
            // Invalid measurement
            consecutiveInvalidReadings++;
            
            Serial.print("REJECTED: Distance=");
            Serial.print(rawDistance);
            Serial.print(", Valid=");
            Serial.print(isValidDistance);
            Serial.print(", Reasonable=");
            Serial.println(isReasonableChange);
            
            // If too many consecutive invalid readings, reset filter
            if (consecutiveInvalidReadings > 15) {
                resetFilter();
                consecutiveInvalidReadings = 0;
            }
            
            return lastGoodMeasurement;
        }
    }
    
    void resetFilter() {
        P = 5.0;
        Q = 0.05;
        R = 1.5;
        X = 300.0; // Reset to 3m distance
        lastGoodMeasurement = X;
        measurementCount = 0;
        Serial.println("FILTER RESET!");
    }
    
    float getCurrentDistance() { return X; }
    float getKalmanGain() { return K; }
    float getInnovation() { return innovation; }
    bool isStable() { return (K < 0.02 && measurementCount > 10); } // More strict
    int getInvalidCount() { return consecutiveInvalidReadings; }
    int getMeasurementCount() { return measurementCount; }
    
    // Get filter confidence (0-100%)
    float getConfidence() {
        if (measurementCount < 5) return 0.0;
        float confidence = 100.0 * (1.0 - K);
        return min(confidence, 100.0f);
    }
};

ImprovedDistanceKalman distanceFilter;

// Enhanced JSN-SR04T measurement function
float getJSNDistance() {
    // Multiple pulse attempt for better reliability
    for (int attempt = 0; attempt < 3; attempt++) {
        digitalWrite(trigPin, LOW);
        delayMicroseconds(5);
        digitalWrite(trigPin, HIGH);
        delayMicroseconds(20);
        digitalWrite(trigPin, LOW);
        
        unsigned long duration = pulseIn(echoPin, HIGH, 50000);
        
        if (duration > 0) {
            float distance = (duration * 0.0343) / 2.0;
            // Quick sanity check
            if (distance >= 10.0 && distance <= 600.0) {
                return distance;
            }
        }
        
        delay(10); // Small delay before retry
    }
    
    return -1; // All attempts failed
}

// Enhanced median filter with outlier rejection
float getMedianDistance(int samples = 3) { // Reduced samples for faster response
    float readings[samples];
    int validReadings = 0;
    
    for (int i = 0; i < samples; i++) {
        float distance = getJSNDistance();
        
        if (distance > 0) {
            readings[validReadings] = distance;
            validReadings++;
        }
        
        delay(100); // Reduced delay
    }
    
    if (validReadings == 0) {
        return -1;
    }
    
    // Sort readings
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
    delay(2000);
    
    Serial.println("Improved JSN-SR04T Distance Monitoring with Tuned Kalman Filter");
    Serial.println("================================================================");
    Serial.println("Distance Range: 30cm - 570cm");
    Serial.println("Filter: Q=0.05, R=1.5, P=5.0");
    Serial.println();
    Serial.println("Time(s)\tRaw(cm)\tFiltered(cm)\tInnovation\tGain\tConfidence%\tStatus");
    
    // Test sensor connectivity
    Serial.println("Testing JSN-SR04T sensor...");
    float testDist = getJSNDistance();
    if (testDist > 0) {
        Serial.print("Sensor OK - Initial reading: ");
        Serial.print(testDist);
        Serial.println(" cm");
        
        // Initialize filter with first reading
        distanceFilter.updateDistance(testDist);
    } else {
        Serial.println("Warning: No response from sensor!");
    }
    Serial.println("Starting measurements...");
}

void loop() {
    // Get median distance from multiple readings
    float rawDistance = getMedianDistance(3);
    
    if (rawDistance < 0) {
        Serial.print(millis()/1000);
        Serial.print("\t");
        Serial.print("NO_ECHO");
        Serial.print("\t");
        Serial.print(distanceFilter.getCurrentDistance(), 2);
        Serial.print("\t\t");
        Serial.print("---");
        Serial.print("\t\t");
        Serial.print(distanceFilter.getKalmanGain(), 4);
        Serial.print("\t");
        Serial.print(distanceFilter.getConfidence(), 1);
        Serial.print("\t\t");
        Serial.println("ERROR");
        
        delay(2000);
        return;
    }
    
    // Update distance with Kalman filter
    float kalmanDistance = distanceFilter.updateDistance(rawDistance);
    
    // Print detailed results
    Serial.print(millis()/1000);
    Serial.print("\t");
    Serial.print(rawDistance, 2);
    Serial.print("\t");
    Serial.print(kalmanDistance, 2);
    Serial.print("\t\t");
    Serial.print(distanceFilter.getInnovation(), 2);
    Serial.print("\t\t");
    Serial.print(distanceFilter.getKalmanGain(), 4);
    Serial.print("\t");
    Serial.print(distanceFilter.getConfidence(), 1);
    Serial.print("\t\t");
    
    if (distanceFilter.isStable()) {
        Serial.println("STABLE");
    } else {
        Serial.println("LEARNING");
    }
    
    delay(1500); // Faster sampling for better tracking
}