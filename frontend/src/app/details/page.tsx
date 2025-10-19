"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, Battery, Wifi, AlertCircle } from "lucide-react"
import { getStatusColor, getTrendIcon, getChangeColor, getSensorStatusIcon } from "@/lib/utils"
import { useState, useEffect } from "react"
import AxiosInstance from "@/lib/axios-instance"
import type { Unit } from "@/types"

interface LatestDataResponse {
  unit_id: string
  unit_name: string
  location: string
  sensor_data: {
    distance: number
    temperature: number
    battery: number
    rssi: number
    snr: number
    last_updated: string
  }
  alert_levels: {
    normal: number
    warning: number
    high: number
    critical: number
  }
  is_active: boolean
}

function DetailsContent() {
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [latestData, setLatestData] = useState<LatestDataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await AxiosInstance.get("/api/units")
        console.log("Units response:", response.data)
        
        if (response.data && response.data.units && Array.isArray(response.data.units)) {
          setUnits(response.data.units)
          
          // Auto-select first unit
          if (response.data.units.length > 0 && !selectedUnit) {
            setSelectedUnit(response.data.units[0])
          }
        }
      } catch (error) {
        console.error("Error fetching units:", error)
      }
    }

    fetchUnits()
  }, [])

  // Fetch latest data for selected unit
  useEffect(() => {
    if (!selectedUnit?.unit_id) return

    const fetchLatestData = async () => {
      setLoading(true)
      setError(null)
      try {
        const endpoint = `/api/latest-data/${selectedUnit.unit_id}`
        const response = await AxiosInstance.get(endpoint)
        setLatestData(response.data)
        setError(null)
      } catch (error: any) {
        // Only log non-404 errors
        if (error.response?.status !== 404) {
          console.error("Error fetching latest data:", error)
        }
        
        if (error.response?.status === 404) {
          setError(`No recent data available for unit ${selectedUnit.unit_id}. Unit may not have sent data yet.`)
        } else {
          setError(error.response?.data?.detail || "Failed to fetch latest data")
        }
        setLatestData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestData()
  }, [selectedUnit?.unit_id])

  // Safety check - if no selected unit, show message
  if (!selectedUnit) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No unit selected. Please select a unit from the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Display error message if data fetch failed
  if (error) {
    return (
      <div className="space-y-6">
        {/* Unit Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-6 w-6" />
              Unit Details
            </CardTitle>
            <CardDescription>Select a unit to view comprehensive information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {units.map((unit: any) => (
                <Button
                  key={unit.unit_id}
                  variant={selectedUnit.unit_id === unit.unit_id ? "default" : "outline"}
                  onClick={() => setSelectedUnit(unit)}
                  className="h-auto p-3"
                >
                  <div className="text-center">
                    <div className="font-semibold">{unit.unit_name}</div>
                    <div className="text-xs opacity-70">{unit.unit_id}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-700 text-lg font-semibold mb-2">No Recent Data Available</p>
            <p className="text-orange-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Display loading state
  if (loading || !latestData) {
    return (
      <div className="space-y-6">
        {/* Unit Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-6 w-6" />
              Unit Details
            </CardTitle>
            <CardDescription>Select a unit to view comprehensive information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {units.map((unit: any) => (
                <Button
                  key={unit.unit_id}
                  variant={selectedUnit.unit_id === unit.unit_id ? "default" : "outline"}
                  onClick={() => setSelectedUnit(unit)}
                  className="h-auto p-3"
                >
                  <div className="text-center">
                    <div className="font-semibold">{unit.unit_name}</div>
                    <div className="text-xs opacity-70">{unit.unit_id}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading unit details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Unit Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-6 w-6" />
            Unit Details
          </CardTitle>
          <CardDescription>Select a unit to view comprehensive information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {units.map((unit: any) => (
              <Button
                key={unit.unit_id}
                variant={selectedUnit.unit_id === unit.unit_id ? "default" : "outline"}
                onClick={() => setSelectedUnit(unit)}
                className="h-auto p-3"
              >
                <div className="text-center">
                  <div className="font-semibold">{unit.unit_name}</div>
                  <div className="text-xs opacity-70">{unit.unit_id}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Unit Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{latestData.unit_name}</CardTitle>
              <CardDescription className="text-lg">{latestData.location || 'Location not set'}</CardDescription>
            </div>
            <Badge variant={latestData.is_active ? "default" : "destructive"} className="text-sm">
              {latestData.is_active ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {latestData.sensor_data.distance.toFixed(2)}cm
              </div>
              <p className="text-gray-600 mb-3">Current Distance</p>
              <p className="text-xs text-gray-500">
                {latestData.sensor_data.distance === 0 ? "Error - No Reading" : "From Sensor"}
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <Battery className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">{latestData.sensor_data.battery.toFixed(0)}%</div>
              <p className="text-gray-600 mb-3">Battery Level</p>
              <Progress value={latestData.sensor_data.battery} className="h-3" />
            </div>

            <div className="text-center p-6 bg-amber-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <span className="text-3xl">Temperature</span>
              </div>
              <div className="text-4xl font-bold text-amber-600 mb-2">{latestData.sensor_data.temperature.toFixed(1)}°C</div>
              <p className="text-gray-600 mb-3">Temperature</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <Wifi className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-2">
                RSSI: {latestData.sensor_data.rssi.toFixed(0)} dBm
              </div>
              <p className="text-gray-600 mb-3">Signal Strength</p>
              <p className="text-xs text-gray-500">SNR: {latestData.sensor_data.snr.toFixed(1)}</p>
            </div>
          </div>

          {/* Alert Levels */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Alert Levels Configuration</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-lg">Normal Level</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{latestData.alert_levels.normal.toFixed(1)}cm</div>
                <p className="text-sm text-gray-600">From Sensor</p>
              </div>

              <div className="p-6 border-2 border-yellow-200 rounded-xl bg-yellow-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-lg">Warning Level</span>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">{latestData.alert_levels.warning.toFixed(1)}m</div>
                <p className="text-sm text-gray-600">First alert threshold</p>
              </div>

              <div className="p-6 border-2 border-orange-200 rounded-xl bg-orange-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-lg">High Level</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{latestData.alert_levels.high.toFixed(1)}m</div>
                <p className="text-sm text-gray-600">High alert threshold</p>
              </div>

              <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-lg">Critical Level</span>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">{latestData.alert_levels.critical.toFixed(1)}m</div>
                <p className="text-sm text-gray-600">Critical alert threshold</p>
              </div>
            </div>
          </div>

          {/* Location & Technical Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Location Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit ID:</span>
                  <span className="font-mono font-semibold">{latestData.unit_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{latestData.location || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-sm">
                    {new Date(latestData.sensor_data.last_updated).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit Status:</span>
                  <Badge variant={latestData.is_active ? "default" : "destructive"} className="text-sm">
                    {latestData.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sensor Reading:</span>
                  <Badge variant={latestData.sensor_data.distance === 0 ? "destructive" : "default"} className="text-sm">
                    {latestData.sensor_data.distance === 0 ? "ERROR" : "OPERATIONAL"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DetailsPage() {
  return <DetailsContent />
}
