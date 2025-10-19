"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from "react";

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
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only setup WebSocket if shouldConnect is true
    if (!shouldConnect) {
      // If shouldConnect is false, clean up any existing connection
      if (wsRef.current) {
        console.log("Closing WebSocket due to shouldConnect=false");
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setSensorData(null);
      setError(null);
      return;
    }

    // Don't reconnect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket already connected or connecting, skipping setup");
      return;
    }

    // Function to create and setup WebSocket
    const setupWebSocket = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Attempting to connect to WebSocket (attempt ${reconnectAttempt + 1})...`);
      }
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Check if WebSocket URL is defined
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        if (process.env.NODE_ENV === 'development') {
          console.error("WebSocket URL is not defined in environment variables");
        }
        setError("WebSocket URL is not configured");
        return;
      }
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Connecting to WebSocket at: ${wsUrl}`);
        }
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Connection opened
        ws.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ WebSocket Connected successfully");
          }
          setIsConnected(true);
          setError(null);
          setReconnectAttempt(0); // Reset reconnect attempts on successful connection
        };

        // Listen for messages
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (process.env.NODE_ENV === 'development') {
              console.log("WebSocket message received:", data);
            }
            // Remove the distance check since we're using height/hight
            if (data.unit_id) {
              setSensorData({
                unit_id: data.unit_id,
                hight: data.hight || data.height || 0, // Support both spellings
                temperature: data.temperature || 0,
                battery: data.battery || 0,
                signal: data.signal || 0,
                unit: data.unit || data.unit_id,
                sensor_status: data.sensor_status || 0,
                status:data.status  || "normal", // Default to "normal" if not provided
                trend: data.trend || "stable", // Default to "stable"
                normal_level: data.normal_level || data.normalLevel, // Normal level in cm
                alert_levels: data.alert_levels ? {
                  normal: data.alert_levels.normal,
                  warning: data.alert_levels.warning,
                  high: data.alert_levels.high,
                  critical: data.alert_levels.critical
                } : undefined
              });
            }
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error("Error parsing WebSocket message:", err);
            }
          }
        };

        // Handle errors
        ws.onerror = (event) => {
          // Silently log the error without showing in console for production
          if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ WebSocket error - Backend server may not be running");
          }
          setError("WebSocket connection unavailable");
          setIsConnected(false);
        };

        // Connection closed
        ws.onclose = (event) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔌 WebSocket Disconnected (code: ${event.code})`);
          }
          setIsConnected(false);
          
          // Only attempt to reconnect if it wasn't a clean close and we haven't tried too many times
          if (event.code !== 1000 && shouldConnect && reconnectAttempt < 5) {
            // Attempt to reconnect with exponential backoff
            const reconnectDelay = Math.min(1000 * (2 ** reconnectAttempt), 30000);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`⏱️ Will attempt to reconnect in ${reconnectDelay/1000} seconds`);
            }
            
            setTimeout(() => {
              setReconnectAttempt(prev => prev + 1);
            }, reconnectDelay);
          } else if (reconnectAttempt >= 5) {
            setError("Unable to connect to real-time updates. Using cached data.");
          }
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("❌ Failed to create WebSocket:", error);
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to create WebSocket connection: ${errorMessage}`);
        
        // Try again later if shouldConnect is still true (max 5 attempts)
        if (shouldConnect && reconnectAttempt < 5) {
          setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
          }, 5000);
        }
      }
    };

    setupWebSocket();

    // Clean up on unmount
    return () => {
      if (wsRef.current) {
        console.log("Closing WebSocket due to component unmount");
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [reconnectAttempt, shouldConnect]); // Reconnect when reconnectAttempt changes or shouldConnect changes

  return (
    <WebSocketContext.Provider value={{ sensorData, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);