#ifndef IMPROVED_DISTANCE_KALMAN_H
#define IMPROVED_DISTANCE_KALMAN_H

#include <Arduino.h>

// JSN-SR04T constants - DISTANCE ONLY
const float MIN_DISTANCE = 30.0; // JSN-SR04T minimum distance (30cm)
const float MAX_DISTANCE = 570.0; // JSN-SR04T maximum distance (5.7m)

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
            
            return -1;
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

#endif // IMPROVED_DISTANCE_KALMAN_H