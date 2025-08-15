#include "config.h"

OneWire oneWire(tempPin);
DallasTemperature sensors(&oneWire);


void setTemperatureSensor() {
  sensors.begin();
}

float readTemperature() {
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);
  Serial.print("Temperature: ");
  Serial.println(temperature);
  return temperature;
}