#define TRIG_PIN 5
#define ECHO_PIN 18
#define MAX_DISTANCE 400
#define TIMEOUT_US (MAX_DISTANCE * 58)

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delay(1); // 1ms instead of 2 microseconds
  
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10); // Keep this as microseconds - it's critical
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, TIMEOUT_US);
  
  if (duration == 0) {
    Serial.println("Distance: No echo received");
  } else {
    float distance_cm = duration * 0.034 / 2;
    
    if (distance_cm > 2 && distance_cm < MAX_DISTANCE) {
      Serial.print("Distance: ");
      Serial.print(distance_cm);
      Serial.println(" cm");
    } else {
      Serial.println("Distance: Invalid reading");
    }
  }
  
  delay(1500);
}