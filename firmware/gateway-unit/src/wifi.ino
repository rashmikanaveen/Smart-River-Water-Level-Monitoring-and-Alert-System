
#include "config.h"




void setupWiFi(){
  WiFiManager wifiManager;
  bool res=wifiManager.autoConnect("My Esp32","12345678");
  if(!res){
    Serial.println("Failed to connect");
    ESP.restart();
  }else{
    Serial.println("Connected to WiFi");
    

  }
  Serial.println("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("Connecting to WiFi...");
  
  
}
