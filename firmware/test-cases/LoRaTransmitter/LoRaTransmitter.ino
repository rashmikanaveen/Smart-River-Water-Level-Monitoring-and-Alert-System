#include <SPI.h>
#include <LoRa.h>

#define SS_PIN    5   // LoRa radio chip select
#define RST_PIN   14  // LoRa radio reset
#define DIO0_PIN  2   // LoRa radio DIO0

int packetCounter = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("LoRa Transmitter Starting...");

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

void loop() {
  // Create a proper message with packet counter
  String message = "Hello from RA02! Packet #" + String(packetCounter);
  
  Serial.print("Sending: ");
  Serial.println(message);
  
  // Send packet with proper structure
  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();
  
  // Wait for packet to be sent completely
  delay(100);
  
  packetCounter++;
  
  Serial.println("Packet sent successfully");
  Serial.println("------------------------");
  
  delay(3000); // Send every 3 seconds
}