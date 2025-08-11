#include "config.h"


// Memory-efficient JSON with rounded integers
String createRoundedJSON(String sensorId, float distance, float temperature,int percentage) {
  // Round distance to nearest cm and temperature to nearest degree
  int roundedDistance = (int)round(distance);
  int roundedTemperature = (int)round(temperature);
  
  String json = "{\"i\":\""; //id of a sensor unit
  json += sensorId;
  json += "\",\"d\":";   // distence to water lavel from sensor
  json += String(roundedDistance);
  json += ",\"t\":";  // te,perature
  json += String(roundedTemperature);
  json += ",\"b\":";   // battry presentage
  json += String(percentage);
  json += "}";
  return json;
}




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

  float temperature = 25.0; //getTemperature();
  int percentage = 75; //getBatteryPercentage();
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

  String jsonMessage = createRoundedJSON("001", kalmanDistance, temperature,percentage);
  // Print to Serial for debugging
  Serial.print("Sending: ");
  Serial.println(jsonMessage);
  
  // Send JSON over LoRa
  LoRa.beginPacket();
  LoRa.print(jsonMessage);
  LoRa.endPacket();
  
  // Wait for packet to be sent completely
  delay(100);
  
  
  
  Serial.print("Packet #");
 
  Serial.print(" sent (");
  Serial.print(jsonMessage.length());
  Serial.println(" bytes)");
  Serial.println("------------------------");
  
  delay(10000); // Send every 10 seconds
}

