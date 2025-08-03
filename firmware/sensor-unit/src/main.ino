#include "config.h"


void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Disabling WiFi and Bluetooth...");
  
  // Disable WiFi
  disableWiFi();
  
  // Disable Bluetooth
  disableBluetooth();
  
  Serial.println("Both WiFi and Bluetooth are now disabled");
  Serial.println("Power consumption should be significantly reduced");
  setupSensors();
  // Initialize LoRa
  setLoRa();
}

void loop() {
  // Your main application code here
  // Power consumption is now minimized with radios disabled
  float rawDistance = getMedianDistance(3);
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
    
    delay(1500);


  sendLoRaMessage("Distance" ,String(kalmanDistance).c_str());
  delay(5000);
}

