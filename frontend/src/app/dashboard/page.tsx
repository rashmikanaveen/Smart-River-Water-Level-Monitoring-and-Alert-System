"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, Edit } from "lucide-react"
import { UnitCard } from "@/components/units/unit-card"
import { WaterLevelChart } from "@/components/charts/water-level-chart"
import { useUnitContext } from "@/context/unit-context"
import { WebSocketProvider } from "@/context/websocket-context"
import { useState, useEffect, useRef } from "react"
import AxiosInstance from "@/lib/axios-instance"
import type { Unit } from "@/types"

function DashboardContent() {
  const {
    selectedUnit,
    setSelectedUnit,
    risingCount,
    criticalRising,
  } = useUnitContext()

  const [units, setUnits] = useState<Unit[]>([])
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [apiAlertLevels, setApiAlertLevels] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const fetchingRef = useRef(false)

  // Fetch all units from backend on mount
  const fetchUnits = async () => {
  try {
    const response = await AxiosInstance.get("/api/units")
    console.log("📥 API response:", response.data) // Debug log
    
    // Extract the units array from the response
    if (response.data && response.data.units && Array.isArray(response.data.units)) {
      setUnits(response.data.units)
      
      // Auto-select the first unit if no unit is selected
      if (response.data.units.length > 0 && !selectedUnit) {
        setSelectedUnit(response.data.units[0])
      }
    } else {
      setUnits([])
    }
  } catch (error) {
    console.error("Error fetching units:", error)
    setUnits([])
  }
}

  // Fetch historical data for selected unit
  const fetchHistoricalData = async (unitId: string) => {
    console.log("🔄 Starting to fetch historical data for:", unitId)
    setLoadingHistory(true)
    try {
      const response = await AxiosInstance.get(`/api/averages/${unitId}`)
      console.log("📊 Historical data response:", response.data)
      
      // Store alert levels from API (already in cm)
      if (response.data && response.data.alert_levels) {
        console.log("📏 Alert levels from API:", response.data.alert_levels)
        setApiAlertLevels(response.data.alert_levels)
      }
      
      // Check if response has the data array
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Transform the API data to chart format
        // Note: Lower values mean water is rising (distance from sensor is less)
        // Data is already in centimeters (cm)
        const chartData = response.data.data
          .slice(-50) // Get last 50 days
          .map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            level: item.avg_height || item.avg_hight || 0, // Data is in cm (note: API uses avg_height)
          }))
        
        console.log("✅ Transformed chart data:", chartData)
        console.log("📈 Chart data length:", chartData.length)
        
        setHistoricalData(chartData)
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: if data is directly an array (old format)
        const chartData = response.data
          .slice(-50)
          .map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            level: item.avg_height || item.avg_hight || 0,
          }))
        console.log("✅ Transformed chart data (array format):", chartData)
        setHistoricalData(chartData)
      } else {
        console.log("⚠️ No valid data found")
        setHistoricalData([])
      }
    } catch (error) {
      console.error("❌ Error fetching historical data:", error)
      setHistoricalData([])
      setApiAlertLevels(null)
    } finally {
      setLoadingHistory(false)
      console.log("✅ Finished fetching historical data")
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  // Auto-select first unit when units are loaded
  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      console.log("🎯 Auto-selecting first unit:", units[0].name)
      setSelectedUnit(units[0])
    }
  }, [units, selectedUnit, setSelectedUnit])

  // Fetch historical data when selected unit changes
  useEffect(() => {
    console.log("🎯 Selected unit changed:", selectedUnit?.unit_id, selectedUnit?.name)
    if (selectedUnit?.unit_id && !fetchingRef.current) {
      console.log("🚀 Fetching data for unit:", selectedUnit.unit_id)
      fetchingRef.current = true
      fetchHistoricalData(selectedUnit.unit_id).finally(() => {
        fetchingRef.current = false
      })
    } else if (!selectedUnit?.unit_id) {
      console.log("⚠️ No unit selected, showing mock data")
    }
  }, [selectedUnit?.unit_id])

  // Debug effect
  useEffect(() => {
    console.log("Dashboard state:", {
      unitsCount: units.length,
      selectedUnit: selectedUnit?.name,
      historicalDataCount: historicalData.length,
      loading: loadingHistory
    })
  }, [units, selectedUnit, historicalData, loadingHistory])

  return (
    <div className="space-y-6">
      {/* Units Grid */}
      {units.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {units.map((unit) => (
            <UnitCard
              key={unit.unit_id}
              unit_id={unit.unit_id}
            />
          ))}
        </div>
      )}

      {/* Selected Unit Chart */}
      {selectedUnit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedUnit.name} - Historical Trend</CardTitle>
                <CardDescription>
                  Water level changes over time (Last {historicalData.length} days) • Lower values indicate rising water
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Rename
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading historical data...</p>
                </div>
              </div>
            ) : historicalData.length > 0 ? (
              <>
                <WaterLevelChart 
                  data={historicalData}
                  alertLevels={{
                    // API already returns values in cm, convert to meters for the chart
                    normal: apiAlertLevels?.normal ? apiAlertLevels.normal / 100 : undefined,
                    warning: apiAlertLevels?.warning ? apiAlertLevels.warning / 100 : undefined,
                    high: apiAlertLevels?.high ? apiAlertLevels.high / 100 : undefined,
                    critical: apiAlertLevels?.critical ? apiAlertLevels.critical / 100 : undefined,
                  }}
                />
                
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No historical data available for this unit</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rising Summary */}
      {risingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-orange-800">
              <ArrowUp className="h-6 w-6" />
              Rising Levels Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{risingCount}</div>
                <p className="text-sm text-orange-700">Units Rising</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{criticalRising}</div>
                <p className="text-sm text-red-700">Critical Rise</p>
              </div>
              {/* You may want to fetch unit data for these stats */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">-</div>
                <p className="text-sm text-blue-700">Max Increase</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">-</div>
                <p className="text-sm text-green-700">Stable Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <WebSocketProvider shouldConnect={true}>
      <DashboardContent />
    </WebSocketProvider>
  )
}