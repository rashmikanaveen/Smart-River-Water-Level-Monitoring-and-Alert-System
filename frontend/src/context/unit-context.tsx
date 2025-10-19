"use client"

import { useState, createContext, useContext, useMemo, type ReactNode } from "react"
import type { Unit } from "@/types"

interface UnitContextType {
  selectedUnit: Unit | null
  setSelectedUnit: (unit: Unit | null) => void
  risingCount: number
  criticalRising: number
}

const UnitContext = createContext<UnitContextType | undefined>(undefined)

export const UnitProvider = ({ children }: { children: ReactNode }) => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  // These will be calculated from WebSocket data in the components
  const risingCount = 0
  const criticalRising = 0

  const value = useMemo(
    () => ({
      selectedUnit,
      setSelectedUnit,
      risingCount,
      criticalRising,
    }),
    [selectedUnit, risingCount, criticalRising],
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