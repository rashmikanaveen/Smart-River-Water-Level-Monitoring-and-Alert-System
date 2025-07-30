"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, Battery, Wifi } from "lucide-react"
import { getStatusColor, getTrendIcon, getChangeColor, getSensorStatusIcon } from "@/lib/utils"
import { useUnitContext } from "@/context/unit-context"
import type { Unit } from "@/types"

export default function DetailsPage() {
  const { units, selectedUnit, setSelectedUnit, startRenaming } = useUnitContext()

  const handleStartRenaming = (unit: Unit) => {
    startRenaming(unit.id, unit.name)
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
            {units.map((unit: Unit) => (
              <Button
                key={unit.id}
                variant={selectedUnit.id === unit.id ? "default" : "outline"}
                onClick={() => setSelectedUnit(unit)}
                className="h-auto p-3"
              >
                <div className="text-center">
                  <div className="font-semibold">{unit.name}</div>
                  <div className="text-xs opacity-70">{unit.currentLevel.toFixed(2)}m</div>
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
              <CardTitle className="text-2xl">{selectedUnit.name}</CardTitle>
              <CardDescription className="text-lg">{selectedUnit.location}</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => handleStartRenaming(selectedUnit)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Rename Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">{selectedUnit.currentLevel.toFixed(2)}m</div>
              <p className="text-gray-600 mb-3">Current Level</p>
              <div className="flex items-center justify-center gap-2">
                {getTrendIcon(selectedUnit.trend, selectedUnit.changeInCm)}
                <span className={`font-semibold ${getChangeColor(selectedUnit.changeInCm, selectedUnit.trend)}`}>
                  {selectedUnit.trend === "up" ? "+" : ""}
                  {selectedUnit.changeInCm}cm
                </span>
              </div>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <Battery className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">{selectedUnit.battery}%</div>
              <p className="text-gray-600 mb-3">Battery Level</p>
              <Progress value={selectedUnit.battery} className="h-3" />
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <Wifi className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">{selectedUnit.signal}%</div>
              <p className="text-gray-600 mb-3">Signal Strength</p>
              <Progress value={selectedUnit.signal} className="h-3" />
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                {getSensorStatusIcon(selectedUnit.sensorStatus)}
              </div>
              <div className="text-2xl font-bold capitalize mb-2">{selectedUnit.sensorStatus}</div>
              <p className="text-gray-600">Sensor Status</p>
            </div>
          </div>

          {/* Alert Levels */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Alert Levels Configuration</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 border-2 border-yellow-200 rounded-xl bg-yellow-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-lg">Warning Level</span>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">{selectedUnit.alertLevels.warning}m</div>
                <p className="text-sm text-gray-600">First alert threshold</p>
              </div>

              <div className="p-6 border-2 border-orange-200 rounded-xl bg-orange-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-lg">High Level</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{selectedUnit.alertLevels.high}m</div>
                <p className="text-sm text-gray-600">High alert threshold</p>
              </div>

              <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-lg">Critical Level</span>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">{selectedUnit.alertLevels.critical}m</div>
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
                  <span className="font-mono font-semibold">{selectedUnit.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{selectedUnit.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono">{selectedUnit.coordinates.lat.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono">{selectedUnit.coordinates.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Status:</span>
                  <Badge variant={getStatusColor(selectedUnit.status)} className="text-sm">
                    {selectedUnit.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sensor Health:</span>
                  <div className="flex items-center gap-2">
                    {getSensorStatusIcon(selectedUnit.sensorStatus)}
                    <span className="capitalize font-medium">{selectedUnit.sensorStatus}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium">{selectedUnit.lastUpdate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Previous Level:</span>
                  <span className="font-mono font-semibold">{selectedUnit.previousLevel.toFixed(2)}m</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
