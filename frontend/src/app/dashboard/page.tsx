"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, Edit } from "lucide-react"
import { UnitCard } from "@/components/units/unit-card"
import { WaterLevelChart } from "@/components/charts/water-level-chart"
import { useUnitContext } from "@/context/unit-context"
import { useState, useEffect } from "react"
import AxiosInstance from "@/lib/axios-instance"
import { generateMockData } from "@/lib/mockData"
import type { Unit } from "@/types"

export default function DashboardPage() {
  const {
    selectedUnit,
    risingCount,
    criticalRising,
  } = useUnitContext()

  const [units, setUnits] = useState<Unit[]>([])
  const [historicalData] = useState(generateMockData())

  // Fetch all units from backend on mount
  const fetchUnits = async () => {
  try {
    const response = await AxiosInstance.get("/units")
    console.log("API response:", response.data) // Debug log
    
    // Extract the units array from the response
    if (response.data && response.data.units && Array.isArray(response.data.units)) {
      setUnits(response.data.units)
    } else {
      setUnits([])
    }
  } catch (error) {
    console.error("Error fetching units:", error)
    setUnits([])
  }
}

  useEffect(() => {
    fetchUnits()
  }, [])

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
                <CardTitle className="text-2xl">{selectedUnit.name} - 7 Day Trend</CardTitle>
                <CardDescription>Water level changes over time</CardDescription>
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
            <WaterLevelChart data={historicalData} />
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