"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Edit, Check, X } from "lucide-react"
import { getStatusColor, getTrendIcon, getChangeColor } from "@/lib/utils"
import type { Unit } from "@/types"

interface UnitCardProps {
  unit: Unit
  isSelected: boolean
  onSelect: (unit: Unit) => void
  editingName: string | null
  tempName: string
  setTempName: (name: string) => void
  onStartRenaming: (unit: Unit) => void
  onSaveRenaming: (unitId: string) => void
  onCancelRenaming: () => void
}

export const UnitCard = ({
  unit,
  isSelected,
  onSelect,
  editingName,
  tempName,
  setTempName,
  onStartRenaming,
  onSaveRenaming,
  onCancelRenaming,
}: UnitCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${unit.trend === "up" && unit.changeInCm >= 10 ? "border-red-300 bg-red-50" : ""}`}
      onClick={() => onSelect(unit)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            {editingName === unit.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveRenaming(unit.id)
                    if (e.key === "Escape") onCancelRenaming()
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={() => onSaveRenaming(unit.id)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelRenaming}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h3 className="font-semibold text-lg truncate">{unit.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartRenaming(unit)
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Badge variant={getStatusColor(unit.status)}>{unit.status.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold text-blue-600">{unit.currentLevel.toFixed(2)}m</div>
          {getTrendIcon(unit.trend, unit.changeInCm)}
        </div>

        <div className={`text-lg font-semibold mb-3 ${getChangeColor(unit.changeInCm, unit.trend)}`}>
          {unit.trend === "up" ? "+" : ""}
          {unit.changeInCm}cm
          <span className="text-sm text-gray-500 ml-2">from {unit.previousLevel.toFixed(2)}m</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Battery:</span>
            <span className="font-medium">{unit.battery}%</span>
          </div>
          <Progress value={unit.battery} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Signal:</span>
            <span className="font-medium">{unit.signal}%</span>
          </div>
          <Progress value={unit.signal} className="h-2" />

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-500">Updated:</span>
            <span className="text-gray-700">{unit.lastUpdate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
