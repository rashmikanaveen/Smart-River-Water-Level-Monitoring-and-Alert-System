"use client";

import { useWebSocketContext } from "@/context/websocket-context";
import { useEffect, useState } from "react";

// This hook simply returns the raw sensor data for a specific unit
export function useWebSocketData(unitId: string) {
  // Try to get WebSocket context, but handle cases where it might not exist
  let sensorData = null;
  let isConnected = false;
  let error = null;

  try {
    const context = useWebSocketContext();
    sensorData = context.sensorData;
    isConnected = context.isConnected;
    error = context.error;
  } catch (e) {
    // WebSocket context not available (not on dashboard page)
    console.log("WebSocket context not available - this is expected outside of dashboard");
  }
  
  // Only return the sensor data if it matches the requested unit ID
  const relevantData = sensorData && sensorData.unit_id === unitId ? sensorData : null;
  
  return {
    sensorData: relevantData,
    isConnected,
    error
  };
}