"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { getStatusColor, getTrendIcon, getChangeColor } from "@/lib/utils"
import { useUnitContext } from "@/context/unit-context"
import { useState } from "react"
import type { Unit } from "@/types"

export default function MapPage() {
  const { units } = useUnitContext()
  const [showOnlyRising] = useState<boolean>(false) // Assuming this state is managed elsewhere or passed down

  const filteredUnits = showOnlyRising ? units.filter((unit: Unit) => unit.trend === "up") : units

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Unit Locations</CardTitle>
          <CardDescription>GPS locations with current status and water levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center mb-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-gray-600">Unit locations with real-time status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUnits.map((unit: Unit) => (
              <Card key={unit.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{unit.name}</h4>
                    <p className="text-sm text-gray-500 mb-1">
                      {unit.coordinates.lat.toFixed(4)}, {unit.coordinates.lng.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-600">{unit.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(unit.status)}>{unit.currentLevel.toFixed(2)}m</Badge>
                      {getTrendIcon(unit.trend, unit.changeInCm)}
                    </div>
                    <div className={`font-semibold ${getChangeColor(unit.changeInCm, unit.trend)}`}>
                      {unit.trend === "up" ? "+" : ""}
                      {unit.changeInCm}cm
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
