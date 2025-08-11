#include <SPI.h>
#include <LoRa.h>

#define SS_PIN    5   // LoRa radio chip select
#define RST_PIN   14  // LoRa radio reset
#define DIO0_PIN  2   // LoRa radio DIO0


int packetCounter = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("LoRa JSON Transmitter Starting...");

  

  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

  if (!LoRa.begin(433E6)) {  // Set frequency to 433 MHz
    Serial.println("Starting LoRa failed!");
    while (1);
  }
  
  // Configure LoRa parameters for better reliability
  LoRa.setTxPower(20);        // Set TX power to 20dBm
  LoRa.setSpreadingFactor(7); // Set spreading factor (6-12)
  LoRa.setSignalBandwidth(125E3); // Set bandwidth
  LoRa.setCodingRate4(5);     // Set coding rate
  LoRa.enableCrc();           // Enable CRC checking
  
  Serial.println("LoRa Transmitter ready");
  Serial.println("======================");
}

// Function to get distance from JSN-SR04T
float getDistance() {
  
  
  float distance =random(100, 600); // Simulated duration (replace with actual sensor reading)
  
  return distance;
}

// Function to get temperature (simulated - replace with actual sensor)
float getTemperature() {
  // Simulated temperature reading
  return 25.0 + random(-50, 50) / 10.0; // 20.0 to 30.0°C
}

int batterypercentage(){
  int percentage=80;
  return percentage;
}

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

void loop() {
  // Read sensor data
  float temperature = getTemperature();
  float distance = getDistance();
  int percentage=batterypercentage();
  
  // Handle sensor errors
  if (distance < 0) {
    distance = 0.0;  // Or use last known good value
  }
  
  // Create compact JSON string with rounded values
  String jsonMessage = createRoundedJSON("001", distance, temperature,percentage);
  
  // Print to Serial for debugging
  Serial.print("Sending: ");
  Serial.println(jsonMessage);
  
  // Send JSON over LoRa
  LoRa.beginPacket();
  LoRa.print(jsonMessage);
  LoRa.endPacket();
  
  // Wait for packet to be sent completely
  delay(100);
  
  packetCounter++;
  
  Serial.print("Packet #");
  Serial.print(packetCounter);
  Serial.print(" sent (");
  Serial.print(jsonMessage.length());
  Serial.println(" bytes)");
  Serial.println("------------------------");
  
  delay(3000); // Send every 3 seconds
}