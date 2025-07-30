"use client"

import { useState } from "react"

export const useUnitRenaming = () => {
  const [editingName, setEditingName] = useState<string | null>(null)
  const [tempName, setTempName] = useState<string>("")

  const startRenaming = (unitId: string, currentName: string) => {
    setEditingName(unitId)
    setTempName(currentName)
  }

  const cancelRenaming = () => {
    setEditingName(null)
    setTempName("")
  }

  const saveRenaming = (onSave: (name: string) => void) => {
    if (tempName.trim()) {
      onSave(tempName.trim())
    }
    cancelRenaming()
  }

  return {
    editingName,
    tempName,
    setTempName,
    startRenaming,
    cancelRenaming,
    saveRenaming,
  }
}
