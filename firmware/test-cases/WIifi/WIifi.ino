#include<WiFiManager.h>
#include<WiFi.h>

void setupWiFi(){
  WiFiManager wifiManager;
  
  Serial.println("Starting WiFi Manager...");
  
  // Try to connect to WiFi, if fails create AP with name "My Esp32" and password "12345678"
  bool res = wifiManager.autoConnect("My Esp32", "12345678");
  
  if(!res){
    Serial.println("Failed to connect to WiFi");
    Serial.println("Restarting ESP32...");
    ESP.restart();
  } else {
    Serial.println("Successfully connected to WiFi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
  }
}

void setup(){
  Serial.begin(115200);
  delay(1000); // Give serial time to initialize
  
  setupWiFi();
}

void loop(){
  // Check WiFi connection status
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Status: Connected");
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WiFi Status: Disconnected");
    Serial.println("Attempting to reconnect...");
    setupWiFi();
  }
  
  delay(100000); 
}