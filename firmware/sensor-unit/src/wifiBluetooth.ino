#include "config.h"

void disableWiFi() {
  Serial.print("Disabling WiFi... ");
  
  // Stop WiFi using Arduino wrapper
  WiFi.mode(WIFI_OFF);
  
  // Deinitialize WiFi and free resources
  esp_err_t ret = esp_wifi_deinit();
  
  if (ret == ESP_OK) {
    Serial.println("WiFi disabled successfully");
  } else {
    Serial.printf("WiFi disable failed: %s\n", esp_err_to_name(ret));
  }
}

void disableBluetooth() {
  Serial.print("Disabling Bluetooth... ");
  
  // Disable Bluetooth controller
  esp_err_t ret = esp_bt_controller_disable();
  if (ret != ESP_OK) {
    Serial.printf("Bluetooth disable failed: %s\n", esp_err_to_name(ret));
    return;
  }
  
  // Deinitialize Bluetooth and free resources
  ret = esp_bt_controller_deinit();
  if (ret == ESP_OK) {
    Serial.println("Bluetooth disabled successfully");
  } else {
    Serial.printf("Bluetooth deinit failed: %s\n", esp_err_to_name(ret));
  }
}
