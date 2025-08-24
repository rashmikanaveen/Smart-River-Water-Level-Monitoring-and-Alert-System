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
  status: "normal" |"high" | "critical"   ; // Updated to include new statuses
  trend?: "up" | "down" | "stable";
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

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Function to create and setup WebSocket
    const setupWebSocket = () => {
      console.log(`Attempting to connect to WebSocket (attempt ${reconnectAttempt + 1})...`);
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      try {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL as string);
        wsRef.current = ws;

        // Connection opened
        ws.onopen = () => {
          console.log(" WebSocket Connected");
          setIsConnected(true);
          setError(null);
        };

        // Listen for messages
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
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
              });
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        // Handle errors
        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setError("WebSocket connection error");
        };

        // Connection closed
        ws.onclose = (event) => {
          console.log(`WebSocket Disconnected (code: ${event.code}, reason: ${event.reason})`);
          setIsConnected(false);
          
          // Attempt to reconnect with exponential backoff
          const reconnectDelay = Math.min(1000 * (2 ** reconnectAttempt), 30000);
          console.log(`Will attempt to reconnect in ${reconnectDelay/1000} seconds`);
          
          setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
          }, reconnectDelay);
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setError("Failed to create WebSocket connection");
        
        // Try again later
        setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
        }, 5000);
      }
    };

    setupWebSocket();

    // Clean up on unmount
    return () => {
      if (wsRef.current) {
        console.log("Closing WebSocket due to component unmount");
        wsRef.current.close();
      }
    };
  }, [reconnectAttempt]); // Reconnect when reconnectAttempt changes

  return (
    <WebSocketContext.Provider value={{ sensorData, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);