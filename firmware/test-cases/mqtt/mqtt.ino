#include <WiFi.h>
#include <PubSubClient.h>



int i = 0;


WiFiClient espClient;
PubSubClient mqttClient(espClient);


// mqtt 
void setupMQTT(){
  mqttClient.setServer("broker.hivemq.com", 1883);
  mqttClient.setCallback(receviveCallback);
  
}


void connectToBroker(){
  while(!mqttClient.connected()){
    Serial.println("Connecting to MQTT Broker...");
    if(mqttClient.connect("ESP32-rashmikanaveen")){
      Serial.println("Connected to MQTT Broker");
      mqttClient.subscribe("rashmikanaveen");
      mqttClient.subscribe("rashmikanaveen-ts");
      mqttClient.subscribe("rashmikanaveen-tu");
      mqttClient.subscribe("rashmikanaveen-θ_offset");
      mqttClient.subscribe("rashmikanaveen-γ");
      mqttClient.subscribe("rashmikanaveen-T_med");
      mqttClient.subscribe("rashmikanaveen-alarm-on-off");
      mqttClient.subscribe("rashmikanaveen-set-alarm-time");
    }else{
      Serial.print("Failed to connect, rc=");
      Serial.print(mqttClient.state());
      delay(500);
    }
  }
}

void receviveCallback(char* topic, byte* payload, unsigned int length) {
 
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  char payloadCharAr[length + 1]; // Add space for null terminator
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
    payloadCharAr[i] = (char)payload[i];
  }
  payloadCharAr[length] = '\0'; // Null-terminate the string
  Serial.println();
  
  
}

void setup() {
  Serial.begin(115200);
  
  
  // Connect to WiFi
  WiFi.begin("A225G", "2444666666");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");
  setupMQTT();
  
}
void loop() {
  if(!mqttClient.connected()){
    connectToBroker();
  }
  mqttClient.loop();
  mqttClient.publish("rashmikanaveen-mqtt-Test", String(i).c_str());
    i++;
  
  delay(1000); // Adjust delay as needed
}
