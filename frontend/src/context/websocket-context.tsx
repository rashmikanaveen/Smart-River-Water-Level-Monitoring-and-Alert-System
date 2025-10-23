"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import WSManager from "@/lib/ws-manager"

interface SensorData {
  unit_id: string;
  hight: number;
  temperature: number;
  battery: number;
  signal: number;
  unit: string;
  sensor_status: 1|0;
  status: string; // Can be "normal", "warning", "high", "critical" from backend
  trend?: "up" | "down" | "stable";
  normal_level?: number; // Normal water level in cm
  alert_levels?: {
    normal?: number;    // in meters
    warning?: number;   // in meters
    high?: number;      // in meters
    critical?: number;  // in meters
  };
}

interface WebSocketContextType {
  sensorData: SensorData | null;
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  sensorData: null,
  isConnected: false,
  error: null,
});

interface WebSocketProviderProps {
  children: ReactNode;
  shouldConnect?: boolean;
}

export const WebSocketProvider = ({ children, shouldConnect = true }: WebSocketProviderProps) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!shouldConnect) {
      WSManager.close()
      setIsConnected(false)
      setSensorData(null)
      setError(null)
      return
    }

    const url = process.env.NEXT_PUBLIC_WS_URL
    if (!url) {
      setError("WebSocket URL is not configured")
      return
    }

    // Handlers
    const onMessage = (data: any) => {
      if (data && data.unit_id) {
        setSensorData({
          unit_id: data.unit_id,
          hight: data.hight || data.height || 0,
          temperature: data.temperature || 0,
          battery: data.battery || 0,
          signal: data.signal || 0,
          unit: data.unit || data.unit_id,
          sensor_status: data.sensor_status || 0,
          status: data.status || "normal",
          trend: data.trend || "stable",
          normal_level: data.normal_level || data.normalLevel,
          alert_levels: data.alert_levels ? {
            normal: data.alert_levels.normal,
            warning: data.alert_levels.warning,
            high: data.alert_levels.high,
            critical: data.alert_levels.critical
          } : undefined
        })
      }
    }

    const onStatus = (connected: boolean) => {
      setIsConnected(connected)
    }

    const onError = (err: string | null) => {
      setError(err)
    }

    WSManager.addListener(onMessage)
    WSManager.addStatusListener(onStatus)
    WSManager.addErrorListener(onError)

    // Ensure manager is connected
    if (!WSManager.isConnected()) {
      WSManager.connect(url)
    }

    return () => {
      WSManager.removeListener(onMessage)
      WSManager.removeStatusListener(onStatus)
      WSManager.removeErrorListener(onError)
      // Do NOT close the manager here - keep the connection alive across navigations
    }
  }, [shouldConnect]);

  return (
    <WebSocketContext.Provider value={{ sensorData, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);