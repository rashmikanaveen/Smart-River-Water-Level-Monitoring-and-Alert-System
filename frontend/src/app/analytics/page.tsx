"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WaterLevelChart } from "@/components/charts/water-level-chart"
import { useUnitContext } from "@/context/unit-context"
import { useState } from "react"
import { generateMockData } from "@/lib/mockData"
import type { Unit } from "@/types"

export default function AnalyticsPage() {
  const { units, risingCount, criticalRising } = useUnitContext()
  const [historicalData] = useState(generateMockData())

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">7-Day Water Level Analysis</CardTitle>
          <CardDescription>Historical data and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <WaterLevelChart data={historicalData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{risingCount}</div>
          <p className="text-gray-600 mt-1">Rising Units</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{criticalRising}</div>
          <p className="text-gray-600 mt-1">Critical Alerts</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {Math.max(...units.filter((u: Unit) => u.trend === "up").map((u: Unit) => u.changeInCm))}cm
          </div>
          <p className="text-sm text-blue-700">Max Increase</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{units.length}</div>
          <p className="text-sm text-green-700">Total Units</p>
        </Card>
      </div>
    </div>
  )
}
