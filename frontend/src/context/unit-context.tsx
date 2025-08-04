"use client"

import { useState, createContext, useContext, useMemo, type ReactNode } from "react"
import { mockUnits, generateMockData } from "@/lib/mockData"
import { useUnitRenaming } from "@/hooks/use-unit-renaming"
import type { Unit, ChartData } from "@/types"

interface UnitContextType {
  units: Unit[]
  selectedUnit: Unit
  setSelectedUnit: (unit: Unit) => void
  updateUnit: (unitId: string, updates: Partial<Unit>) => void
  updateUnitName: (unitId: string, newName: string) => void
  updateAlertLevels: (unitId: string, alertLevels: { warning: number; high: number; critical: number }) => void
  risingCount: number
  criticalRising: number
  historicalData: ChartData[]
  editingName: string | null
  tempName: string
  setTempName: (name: string) => void
  startRenaming: (unitId: string, currentName: string) => void
  cancelRenaming: () => void
  saveRenaming: (onSave: (name: string) => void) => void
}

const UnitContext = createContext<UnitContextType | undefined>(undefined)

export const UnitProvider = ({ children }: { children: ReactNode }) => {
  const [units, setUnits] = useState<Unit[]>(mockUnits)
  const [selectedUnit, setSelectedUnit] = useState<Unit>(mockUnits[0])
  const [historicalData] = useState<ChartData[]>(generateMockData())

  const { editingName, tempName, setTempName, startRenaming, cancelRenaming, saveRenaming } = useUnitRenaming()

  const updateUnit = (unitId: string, updates: Partial<Unit>) => {
    setUnits((prevUnits) => prevUnits.map((unit) => (unit.unit_id === unitId ? { ...unit, ...updates } : unit)))

    if (selectedUnit.unit_id === unitId) {
      setSelectedUnit((prevSelected) => ({ ...prevSelected, ...updates }))
    }
  }

  const updateUnitName = (unitId: string, newName: string) => {
    updateUnit(unitId, { name: newName })
  }

  const updateAlertLevels = (unitId: string, alertLevels: { warning: number; high: number; critical: number }) => {
    updateUnit(unitId, { alertLevels })
  }

  const risingCount = useMemo(() => units.filter((unit) => unit.trend === "up").length, [units])
  const criticalRising = useMemo(
    () => units.filter((unit) => unit.trend === "up" && unit.changeInCm >= 10).length,
    [units],
  )

  const value = useMemo(
    () => ({
      units,
      selectedUnit,
      setSelectedUnit,
      updateUnit,
      updateUnitName,
      updateAlertLevels,
      risingCount,
      criticalRising,
      historicalData,
      editingName,
      tempName,
      setTempName,
      startRenaming,
      cancelRenaming,
      saveRenaming,
    }),
    [
      units,
      selectedUnit,
      risingCount,
      criticalRising,
      historicalData,
      editingName,
      tempName,
      startRenaming,
      cancelRenaming,
      saveRenaming,
    ],
  )

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>
}

export const useUnitContext = () => {
  const context = useContext(UnitContext)
  if (context === undefined) {
    throw new Error("useUnitContext must be used within a UnitProvider")
  }
  return context
}