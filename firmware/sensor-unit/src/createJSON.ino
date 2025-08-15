#include "config.h"


// Memory-efficient JSON with rounded integers
String createRoundedJSON(String sensorId, float distance, float temperature,int percentage) {
  // Round distance to nearest cm and temperature to nearest degree
  int roundedDistance = (int)round(distance);
  //int roundedTemperature = (int)round(temperature);
  
  String json = "{\"i\":\""; //id of a sensor unit
  json += sensorId;
  json += "\",\"d\":";   // distence to water lavel from sensor
  json += String(roundedDistance);
  json += ",\"t\":";  // te,perature
  json += String(temperature);
  json += ",\"b\":";   // battry presentage
  json += String(percentage);
  json += "}";
  return json;
}

