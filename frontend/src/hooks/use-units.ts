"use client"

import { useState } from "react"
import type { Unit } from "@/types"

export const useUnits = () => {
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  const updateUnit = (unitId: string, updates: Partial<Unit>) => {
    setUnits(units.map((unit) => (unit.unit_id === unitId ? { ...unit, ...updates } : unit)))

    // Update selected unit if it's the one being updated
    if (selectedUnit?.unit_id === unitId) {
      setSelectedUnit({ ...selectedUnit, ...updates })
    }
  }

  const updateUnitName = (unitId: string, newName: string) => {
    updateUnit(unitId, { name: newName })
  }

  const updateAlertLevels = (unitId: string, alertLevels: { warning: number; high: number; critical: number }) => {
    updateUnit(unitId, { alertLevels })
  }

  const risingCount = units.filter((unit) => unit.trend === "up").length
  const criticalRising = units.filter((unit) => unit.trend === "up" && (unit.changeInCm ?? 0) >= 10).length

  return {
    units,
    selectedUnit,
    setSelectedUnit,
    updateUnit,
    updateUnitName,
    updateAlertLevels,
    risingCount,
    criticalRising,
  }
}
