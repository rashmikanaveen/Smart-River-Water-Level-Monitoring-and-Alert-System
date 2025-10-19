"use client";

import { useWebSocketContext } from "@/context/websocket-context";
import { useMemo } from "react";

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
    // console.log("WebSocket context not available - this is expected outside of dashboard");
  }
  
  // Only return the sensor data if it matches the requested unit ID
  // Use useMemo to prevent unnecessary re-renders when data hasn't changed
  const relevantData = useMemo(() => {
    return sensorData && sensorData.unit_id === unitId ? sensorData : null;
  }, [sensorData?.unit_id, sensorData?.hight, sensorData?.battery, sensorData?.signal, sensorData?.temperature, sensorData?.status, unitId]);
  
  return {
    sensorData: relevantData,
    isConnected,
    error
  };
}