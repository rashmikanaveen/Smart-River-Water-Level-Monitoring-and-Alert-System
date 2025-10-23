"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Edit, Check, X, Wifi, WifiOff } from "lucide-react"
import { getStatusColor, getTrendIcon, getChangeColor } from "@/lib/utils"
import { useWebSocketData } from "@/hooks/useWebSocket"
import { useUnitContext } from "@/context/unit-context"
import { useState, useEffect, memo, useMemo } from "react"
import type { Unit } from "@/types"

interface UnitCardProps {
  unit_id: string;
}

export const UnitCard = memo(({ unit_id }: UnitCardProps) => {
  const { selectedUnit, setSelectedUnit } = useUnitContext();
  
  // Local state for the component
  const [data, setData] = useState({
    unit_id: unit_id,
    hight: 0,
    normalLevelCm: 0,
    temperature: 0,
    battery: 0,  
    signal: 0,
    name: unit_id,
    sensor_status: 0,
    status: "normal", // Default status from backend
    trend: "stable" as "up" | "down" | "stable"
  });
  
  // Local state for editing name
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(data.name);
  
  // Check if this unit is selected
  const isSelected = selectedUnit?.unit_id === unit_id;

  // Get WebSocket data
  const { sensorData, isConnected } = useWebSocketData(unit_id);

  

  // Update local state when new sensor data is received
  useEffect(() => {
    if (isConnected && sensorData) {
      setData(prev => ({
        ...prev,
        unit_id: sensorData.unit_id || prev.unit_id,
        name: prev.name, // keep the current name (local rename)
        hight: sensorData.hight,
        normalLevelCm: sensorData.normal_level || prev.normalLevelCm,
        temperature: sensorData.temperature,
        battery: sensorData.battery,
        signal: sensorData.signal,
        status: sensorData.status || "normal", // Use status from WebSocket
        trend: (sensorData.trend || "stable") as "up" | "down" | "stable"
      }));
    }
  }, [sensorData, isConnected]);

  // Update tempName when data.name changes (for editing functionality)
  useEffect(() => {
    setTempName(data.name);
  }, [data.name]);

  // Use status directly from WebSocket data (backend calculates it)
  // Status can be: "normal", "warning", "high", "critical"
  const status = data.status as "normal" | "warning" | "high" | "critical";
  
  // Map status to match Unit type
  const mappedStatus: "normal" | "critical" | "low" = 
    status === "high" || status === "critical" || status === "warning" ? "critical" : "normal";
  
  // Local handlers for the component
  const handleSelect = () => {
    // Create a Unit object from current data
    const unitData: Unit = {
      unit_id: data.unit_id,
      name: data.name,
      location: "", // Add location if available
      trend: data.trend,
      status: mappedStatus,
      battery: data.battery,
      signal: data.signal,
      sensorStatus: "active",
      alertLevels: {
        warning: 0,
        high: 0,
        critical: 0
      }
    };
    setSelectedUnit(unitData);
  };
  
  const handleStartRenaming = () => {
    setIsEditing(true);
    setTempName(data.name);
  };
  
  const handleSaveRenaming = () => {
    setData(prev => ({ ...prev, name: tempName }));
    setIsEditing(false);
  };
  
  const handleCancelRenaming = () => {
    setIsEditing(false);
  };

  // Calculate display values for UI
  const hight = data.hight;
  const displayLevel = hight;
  const normalLevel = data.normalLevelCm;
  const changeFromNormal = normalLevel > 0 ? Math.abs(hight - normalLevel) : 0;
  const displayTrend = data.trend;
  const battery = data.battery;
  const signal = data.signal;

  // Get status color based on alert level
  const getStatusColorClass = () => {
    switch(status) {
      case "normal":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "high":
        return "border-orange-200 bg-orange-50";
      case "critical":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getStatusBadgeClass = () => {
    switch(status) {
      case "normal":
        return "bg-green-100 text-green-800 border border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${getStatusColorClass()}`}
      onClick={handleSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            <div>{data.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? 
              <Wifi className="h-4 w-4 text-green-500" /> : 
              <WifiOff className="h-4 w-4 text-red-500" />
            }
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusBadgeClass()}`}>
              {status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="transition-all duration-300">
            {getTrendIcon(displayTrend, changeFromNormal)}
          </div>
          <div className="text-3xl font-bold text-blue-600 transition-all duration-300">{changeFromNormal.toFixed(1)}cm</div>
          
          {normalLevel > 0 && (
            <span className="text-sm text-gray-500 ml-2">{displayLevel.toFixed(2)}cm from Sensor</span>
          )}
        </div>

        

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Battery:</span>
            <span className="font-medium transition-all duration-300">{battery}%</span>
          </div>
          <Progress value={battery} className="h-2 transition-all duration-500" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Signal:</span>
            <span className="font-medium transition-all duration-300">{signal}%</span>
          </div>
          <Progress value={signal} className="h-2 transition-all duration-500" />

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-500">Status:</span>
            <span className="text-gray-700">{isConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Only re-render if unit_id changes
  return prevProps.unit_id === nextProps.unit_id;
})