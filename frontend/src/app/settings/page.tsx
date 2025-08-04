"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsIcon, Edit, Save, Check, X, Plus } from "lucide-react"
import { getStatusColor } from "@/lib/utils"
import { useUnitContext } from "@/context/unit-context"
import type { Unit } from "@/types"

export default function SettingsPage() {
  const {
    units,
    updateAlertLevels,
    editingName,
    tempName,
    setTempName,
    startRenaming,
    cancelRenaming,
    saveRenaming,
    updateUnitName,
  } = useUnitContext()
  const [editingLevels, setEditingLevels] = useState<{
    [key: string]: { warning: number; high: number; critical: number } | undefined
  }>({})

  const initializeEditing = (unit: Unit) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unit.unit_id]: { ...unit.alertLevels },
    }))
  }

  const handleLevelChange = (unitId: string, level: "warning" | "high" | "critical", value: string) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || { warning: 0, high: 0, critical: 0 }),
        [level]: Number.parseFloat(value) || 0,
      },
    }))
  }

  const handleSaveAlertLevels = (unitId: string) => {
    if (editingLevels[unitId]) {
      updateAlertLevels(unitId, editingLevels[unitId])
      setEditingLevels((prev) => ({ ...prev, [unitId]: undefined }))
    }
  }

  const handleStartRenaming = (unit: Unit) => {
    startRenaming(unit.unit_id, unit.name)
  }

  const handleSaveRenaming = (unitId: string) => {
    saveRenaming((name: string) => updateUnitName(unitId, name))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SettingsIcon className="h-6 w-6" />
              Water Level Alert Settings
            </CardTitle>
            <CardDescription>Configure warning thresholds and rename units</CardDescription>
          </div>
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {units.map((unit: Unit) => (
              <Card key={unit.unit_id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                    <div className="mb-4 lg:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        {editingName === unit.unit_id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="text-xl font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRenaming(unit.unit_id)
                                if (e.key === "Escape") cancelRenaming()
                              }}
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleSaveRenaming(unit.unit_id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelRenaming}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-xl">{unit.name}</h3>
                            <Button size="sm" variant="ghost" onClick={() => handleStartRenaming(unit)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {unit.unit_id} • {unit.location}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span>Current: {4}m</span>
                        <Badge variant={getStatusColor(unit.status)}>{unit.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <Button onClick={() => initializeEditing(unit)} disabled={!!editingLevels[unit.unit_id]}>
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configure Alerts
                    </Button>
                  </div>

                  {editingLevels[unit.unit_id] ? (
                    <div className="space-y-6 p-6 bg-gray-50 rounded-xl">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor={`warning-${unit.unit_id}`} className="font-medium">
                            Warning Level (m)
                          </Label>
                          <Input
                            id={`warning-${unit.unit_id}`}
                            type="number"
                            step="0.01"
                            value={editingLevels[unit.unit_id]?.warning || unit.alertLevels.warning}
                            onChange={(e) => handleLevelChange(unit.unit_id, "warning", e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-sm text-gray-500 mt-1">First alert threshold</p>
                        </div>

                        <div>
                          <Label htmlFor={`high-${unit.unit_id}`} className="font-medium">
                            High Level (m)
                          </Label>
                          <Input
                            id={`high-${unit.unit_id}`}
                            type="number"
                            step="0.01"
                            value={editingLevels[unit.unit_id]?.high || unit.alertLevels.high}
                            onChange={(e) => handleLevelChange(unit.unit_id, "high", e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-sm text-gray-500 mt-1">High alert threshold</p>
                        </div>

                        <div>
                          <Label htmlFor={`critical-${unit.unit_id}`} className="font-medium">
                            Critical Level (m)
                          </Label>
                          <Input
                            id={`critical-${unit.unit_id}`}
                            type="number"
                            step="0.01"
                            value={editingLevels[unit.unit_id]?.critical || unit.alertLevels.critical}
                            onChange={(e) => handleLevelChange(unit.unit_id, "critical", e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-sm text-gray-500 mt-1">Critical alert threshold</p>
                        </div>
                        <div>
                          <Label htmlFor={`warning-${unit.unit_id}`} className="font-medium">
                            Rename
                          </Label>
                          <Input
                            id={`rename-${unit.unit_id}`}
                            placeholder="New unit name"
                            autoFocus
                            disabled={editingName === unit.unit_id}
                            type="text"
                            
                            className="mt-2"
                          />
                          <p className="text-sm text-gray-500 mt-1">First alert threshold</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={() => handleSaveAlertLevels(unit.unit_id)} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingLevels((prev) => ({ ...prev, [unit.unit_id]: undefined }))}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="p-4 border-2 border-yellow-200 rounded-lg text-center bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-600">{unit.alertLevels.warning}m</div>
                        <p className="text-sm text-gray-600 mt-1">Warning</p>
                      </div>
                      <div className="p-4 border-2 border-orange-200 rounded-lg text-center bg-orange-50">
                        <div className="text-2xl font-bold text-orange-600">{unit.alertLevels.high}m</div>
                        <p className="text-sm text-gray-600 mt-1">High</p>
                      </div>
                      <div className="p-4 border-2 border-red-200 rounded-lg text-center bg-red-50">
                        <div className="text-2xl font-bold text-red-600">{unit.alertLevels.critical}m</div>
                        <p className="text-sm text-gray-600 mt-1">Critical</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
