#include <SPI.h>
#include <LoRa.h>

#define SS_PIN    5   // LoRa radio chip select
#define RST_PIN   14  // LoRa radio reset
#define DIO0_PIN  2   // LoRa radio DIO0

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("LoRa Receiver Starting...");

  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
  
  // Configure LoRa parameters (must match transmitter)
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.enableCrc();
  
  Serial.println("LoRa Receiver ready");
  Serial.println("===================");
}

void loop() {
  // Check for incoming packets
  int packetSize = LoRa.parsePacket();
  
  if (packetSize) {
    // Read packet into string buffer safely
    String receivedMessage = "";
    
    // Read all available bytes
    while (LoRa.available()) {
      char c = LoRa.read();
      if (c >= 32 && c <= 126) { // Only printable ASCII characters
        receivedMessage += c;
      }
    }
    
    // Only print if we received a valid message
    if (receivedMessage.length() > 0) {
      Serial.println("=== PACKET RECEIVED ===");
      Serial.print("Message: ");
      Serial.println(receivedMessage);
      Serial.print("RSSI: ");
      Serial.print(LoRa.packetRssi());
      Serial.println(" dBm");
      Serial.print("SNR: ");
      Serial.print(LoRa.packetSnr());
      Serial.println(" dB");
      Serial.print("Packet Size: ");
      Serial.print(packetSize);
      Serial.println(" bytes");
      Serial.println("=======================");
    }
  }
  
  //  delay to prevent watchdog issues
  delay(10);
}