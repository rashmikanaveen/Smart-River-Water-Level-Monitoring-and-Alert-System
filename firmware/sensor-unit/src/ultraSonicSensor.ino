#include "config.h"


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

void setupSensors() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    
    Serial.println("JSN-SR04T Sensor Initialized");
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