"use client"

import Cookies from "js-cookie";
import { useEffect, useState } from "react"
import AxiosInstance from "@/lib/axios-instance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsIcon, Save } from "lucide-react"
import AddUnit from "@/components/addUnit"
import type { Unit } from "@/types"
import { getStatusColor } from "@/lib/utils"

export default function SettingsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [editingLevels, setEditingLevels] = useState<{
    [key: string]: { warning: number | null; high: number | null; critical: number | null } | undefined
  }>({})

  // Fetch all units from backend on mount
  const fetchUnits = async () => {
  try {
    const response = await AxiosInstance.get("/units")
    console.log("API response:", response.data) // Debug log
    
    // Extract the units array from the response
    if (response.data && response.data.units && Array.isArray(response.data.units)) {
      setUnits(response.data.units)
    } else {
      setUnits([])
    }
  } catch (error) {
    console.error("Error fetching units:", error)
    setUnits([])
  }
}

  useEffect(() => {
    fetchUnits()
  }, [])

  // Add unit handler
  const handleAddUnit = async (unitId: string, name?: string) => {
    try {
      await AxiosInstance.post("/addunit", {
        unit_id: unitId,
        name: name ?? ""
      });
      // Refetch units after adding
      fetchUnits()
    } catch (error) {
      console.error("Error adding unit:", error);
    }
  };

  // Alert level editing
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
        ...(prev[unitId] || { warning: null, high: null, critical: null }),
        [level]: value === "" ? null : Number.parseFloat(value),
      },
    }))
  }

  const handleSaveAlertLevels = async (unitId: string) => {
    if (editingLevels[unitId]) {
      try {
        await AxiosInstance.post("/update-alert-levels", {
          unit_id: unitId,
          alertLevels: editingLevels[unitId]
        })
        setEditingLevels((prev) => ({ ...prev, [unitId]: undefined }))
        fetchUnits()
      } catch (error) {
        console.error("Error saving alert levels:", error)
      }
    }
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
            <CardDescription>Configure warning thresholds for your units</CardDescription>
          </div>
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <AddUnit onAdd={handleAddUnit} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Add safety check here */}
            {Array.isArray(units) && units.length > 0 ? (
              units.map((unit: Unit) => (
                <Card key={unit.unit_id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                      <div className="mb-4 lg:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-xl">{unit.name || <span className="text-gray-400">Unnamed</span>}</h3>
                        </div>
                        <p className="text-gray-600 mt-1">
                          {unit.unit_id}
                        </p>
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
                              value={editingLevels[unit.unit_id]?.warning ?? ""}
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
                              value={editingLevels[unit.unit_id]?.high ?? ""}
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
                              value={editingLevels[unit.unit_id]?.critical ?? ""}
                              onChange={(e) => handleLevelChange(unit.unit_id, "critical", e.target.value)}
                              className="mt-2"
                            />
                            <p className="text-sm text-gray-500 mt-1">Critical alert threshold</p>
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
                          <div className="text-2xl font-bold text-yellow-600">{unit.alertLevels?.warning ?? "-" }m</div>
                          <p className="text-sm text-gray-600 mt-1">Warning</p>
                        </div>
                        <div className="p-4 border-2 border-orange-200 rounded-lg text-center bg-orange-50">
                          <div className="text-2xl font-bold text-orange-600">{unit.alertLevels?.high ?? "-" }m</div>
                          <p className="text-sm text-gray-600 mt-1">High</p>
                        </div>
                        <div className="p-4 border-2 border-red-200 rounded-lg text-center bg-red-50">
                          <div className="text-2xl font-bold text-red-600">{unit.alertLevels?.critical ?? "-" }m</div>
                          <p className="text-sm text-gray-600 mt-1">Critical</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No units found. Add a unit to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}