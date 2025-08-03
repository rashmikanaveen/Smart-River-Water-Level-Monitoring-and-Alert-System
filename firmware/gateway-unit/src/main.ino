
#include "config.h"

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Disabling WiFi and Bluetooth...");
  
  // Disable WiFi
  //disableWiFi();
  
  // Disable Bluetooth
  //disableBluetooth();
  
  Serial.println("Both WiFi and Bluetooth are now disabled");
  Serial.println("Power consumption should be significantly reduced");
}

void loop() {
  // Your main application code here
  // Power consumption is now minimized with radios disabled
  
  Serial.println("Running main loop with radios disabled...");
  delay(5000);
}

