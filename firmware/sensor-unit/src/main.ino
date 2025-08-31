#include "config.h"

String unitID = "001"; // Unique identifier for this unit

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
  setTemperatureSensor();
  // Initialize LoRa
  setLoRa();
}

void loop() {

  float temperature = readTemperature(); //get Temperature from sensor
  int percentage = 75; //getBatteryPercentage();
  // Your main application code here
  // Power consumption is now minimized with radios disabled
  float rawDistance = getMedianDistance(12, temperature); // Pass temperature for accurate measurements
  //float kalmanDistance = distanceFilter.updateDistance(rawDistance);
  // Print detailed results
    Serial.print(millis()/1000);
    Serial.print("\t");
    Serial.print(rawDistance, 2);
    //Serial.print("\t");
    //Serial.print(kalmanDistance, 2);
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

  
  
  // OPTION 2: Send as binary with CRC (new method)
  uint8_t binaryData[BINARY_PACKET_SIZE];
  if (packSensorData(unitID, rawDistance, temperature, percentage, binaryData)) {
    Serial.print("Binary: ");
    printBinaryData(binaryData, BINARY_PACKET_SIZE);
    
    // Send binary data over LoRa
    LoRa.beginPacket();
    LoRa.write(binaryData, BINARY_PACKET_SIZE); // Use write() for binary data
    LoRa.endPacket();

    //Serial.print("Data compression: ");
    //Serial.print(((float)(jsonMessage.length() - BINARY_PACKET_SIZE) / jsonMessage.length()) * 100, 1);
    //Serial.println("% reduction");
  } else {
    Serial.println("Error: Failed to pack binary data");
  }
  
  // Wait for packet to be sent completely
  delay(100);
  
  Serial.println("------------------------");
  
  delay(10000); // Send every 10 seconds
}

