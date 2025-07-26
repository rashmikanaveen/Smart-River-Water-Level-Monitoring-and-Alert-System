#define echoPin 18
#define trigPin 5

long duration;
int distance;
int lastValidDistance = 0;

void setup() {
  pinMode(trigPin, OUTPUT); 
  pinMode(echoPin, INPUT);  
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH, 30000);
  distance = duration * 0.0344 / 2;

  if (distance > 2 && distance < 500) {
    // Accept the value and update last valid
    lastValidDistance = distance;
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");
  } else {
    // Use previous good value
    Serial.print("Distance (smoothed): ");
    Serial.print(lastValidDistance);
    Serial.println(" cm (reused)");
  }

  delay(300);
}
