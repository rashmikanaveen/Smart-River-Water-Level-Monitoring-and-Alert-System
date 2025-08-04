"use client";

import { useWebSocketContext } from "@/context/websocket-context";
import { useEffect, useState } from "react";

// This hook simply returns the raw sensor data for a specific unit
export function useWebSocketData(unitId: string) {
  const { sensorData, isConnected, error } = useWebSocketContext();
  
  // Only return the sensor data if it matches the requested unit ID
  const relevantData = sensorData && sensorData.unit_id === unitId ? sensorData : null;
  
  return {
    sensorData: relevantData,
    isConnected,
    error
  };
}