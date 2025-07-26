#include <OneWire.h>
#include <DallasTemperature.h>

#define echoPin 18
#define trigPin 5
#define tempPin 4

long duration;
float distance;
float lastValidDistance = 0;

OneWire oneWire(tempPin);
DallasTemperature tempSensor(&oneWire);

void setup() {
  pinMode(trigPin, OUTPUT); 
  pinMode(echoPin, INPUT);  
  Serial.begin(9600);
  tempSensor.begin();
}

void loop() {
  // Read temperature
  tempSensor.requestTemperatures();
  float temperature = tempSensor.getTempCByIndex(0);

  // Calculate speed of sound in cm/us
  // speed = (331.3 + 0.606 × T) * 100 cm/s → convert to cm/µs
  float speedOfSound = (331.3 + 0.606 * temperature) / 10000.0; // cm/us

  // Trigger ultrasonic pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW);

  // Read echo time
  duration = pulseIn(echoPin, HIGH, 30000); // timeout in µs

  // Calculate distance with temp-adjusted speed
  distance = duration * speedOfSound / 2;

  if (distance > 2 && distance < 500) {
    lastValidDistance = distance;
    Serial.print("Temp: ");
    Serial.print(temperature);
    Serial.print(" °C\tDistance: ");
    Serial.print(distance);
    Serial.println(" cm");
  } else {
    Serial.print("Temp: ");
    Serial.print(temperature);
    Serial.print(" °C\tDistance (smoothed): ");
    Serial.print(lastValidDistance);
    Serial.println(" cm (reused)");
  }

  delay(500);
}
