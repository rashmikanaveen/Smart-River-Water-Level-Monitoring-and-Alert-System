"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowUp, Filter, Edit } from "lucide-react"
import { UnitCard } from "@/components/units/unit-card"
import { WaterLevelChart } from "@/components/charts/water-level-chart"
import { useUnitContext } from "@/context/unit-context"
import { useState } from "react"
import { generateMockData } from "@/lib/mockData"
import type { Unit } from "@/types"

export default function DashboardPage() {
  const {
    units,
    selectedUnit,
    setSelectedUnit,
    risingCount,
    criticalRising,
    editingName,
    tempName,
    setTempName,
    startRenaming,
    cancelRenaming,
    saveRenaming,
    updateUnitName,
  } = useUnitContext()

  const [showOnlyRising, setShowOnlyRising] = useState<boolean>(false)
  const [historicalData] = useState(generateMockData())

  const filteredUnits = showOnlyRising ? units.filter((unit: Unit) => unit.trend === "up") : units

  const handleStartRenaming = (unit: Unit.unit_id) => {
    startRenaming(unit.unit_id, unit.name)
  }

  const handleSaveRenaming = (unitId: string) => {
    saveRenaming((name: string) => updateUnitName(unitId, name))
  }
  const unit_id="001"

  return (
    <div className="space-y-6">
      

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUnits.map((unit: Unit) => (
          <UnitCard
            key={unit_id}
            unit_id={unit_id}
          />
        ))}
      </div>

      {/* Selected Unit Chart */}
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
              onClick={() => handleStartRenaming(selectedUnit)}
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
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.max(...units.filter((u: Unit) => u.trend === "up").map((u: Unit) => u.changeInCm))}cm
                </div>
                <p className="text-sm text-blue-700">Max Increase</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {units.filter((u: Unit) => u.trend !== "up").length}
                </div>
                <p className="text-sm text-green-700">Stable Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
