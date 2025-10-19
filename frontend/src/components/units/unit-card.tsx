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
import { useState, useEffect } from "react"
import type { Unit } from "@/types"

interface UnitCardProps {
  unit_id: string;
}

export const UnitCard = ({ unit_id }: UnitCardProps) => {
  const { selectedUnit, setSelectedUnit } = useUnitContext();
  
  // Local state for the component
  const [data, setData] = useState({
    unit_id: unit_id,
    hight: 0,
    temperature: 0,
    battery: 0,  
    signal: 0,
    name: unit_id,
    sensor_status:0,
    status: "normal", // Default status
    trend: "stable" as "up" | "down" | "stable",
    previousLevel: 4.0,
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
      //console.log('Updating data with sensorData:', sensorData);
      setData(prev => ({
        ...prev,
        unit_id: sensorData.unit_id || prev.unit_id,
        name: prev.name, // keep the current name (local rename)
        previousLevel: typeof prev.hight === 'number' ? prev.hight : 0, // fallback if undefined
        hight: sensorData.hight,
        temperature: sensorData.temperature,
        battery: sensorData.battery,
        signal: sensorData.signal,
        status:sensorData.status ,
        trend: (sensorData.trend || "stable") as "up" | "down" | "stable"
      }));
    }
  }, [sensorData, isConnected]);

  // Update tempName when data.name changes (for editing functionality)
  useEffect(() => {
    setTempName(data.name);
  }, [data.name]);

  
  
  const status = data.status as "normal"| "high" | "critical" ;
  
  // Map status to match Unit type
  const mappedStatus: "normal" | "critical" | "low" = 
    status === "high" ? "critical" : 
    status === "critical" ? "critical" : "normal";
  
  // Local handlers for the component
  const handleSelect = () => {
    // Create a Unit object from current data
    const unitData: Unit = {
      unit_id: data.unit_id,
      name: data.name,
      location: "", // Add location if available
      changeInCm: Math.abs((data.hight - data.previousLevel) * 100),
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
  const displayPrevious = data.previousLevel;
  const changeValue = Math.abs((hight - displayPrevious) * 100);
  const displayChange = changeValue.toFixed(1);
  const displayTrend = data.trend;
  const battery = data.battery;
  const signal = data.signal;

  

  
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${
        status === "normal" ? "border-green-200 bg-green-50" :
        status === "high" ? "border-yellow-200 bg-yellow-50" :
        status === "critical" ? "border-red-200 bg-red-50" :
        "border-gray-200 bg-white"
      }`}
      onClick={handleSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRenaming()
                    if (e.key === "Escape") handleCancelRenaming()
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveRenaming}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelRenaming}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h3 className="font-semibold text-lg truncate">{data.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRenaming();
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? 
              <Wifi className="h-4 w-4 text-green-500" /> : 
              <WifiOff className="h-4 w-4 text-red-500" />
            }
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              status === "normal" ? "bg-green-100 text-green-800 border border-green-200" :
              status === "high" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
              status === "critical" ? "bg-red-100 text-red-800 border border-red-200" :
              "bg-gray-100 text-gray-800 border border-gray-200"
            }`}>
              {status}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold text-blue-600">{displayLevel.toFixed(2)}cm</div>
          {getTrendIcon(displayTrend, changeValue)}
          <span className="text-sm text-gray-500 ml-2">from normal</span>
        </div>

        

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Battery:</span>
            <span className="font-medium">{battery}%</span>
          </div>
          <Progress value={battery} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Signal:</span>
            <span className="font-medium">{signal}%</span>
          </div>
          <Progress value={signal} className="h-2" />

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-500">Status:</span>
            <span className="text-gray-700">{isConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}