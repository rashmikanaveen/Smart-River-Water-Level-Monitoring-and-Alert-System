"use client"

import Cookies from "js-cookie";
import { useEffect, useState } from "react"
import AxiosInstance from "@/lib/axios-instance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SettingsIcon, Save, CheckCircle2, XCircle } from "lucide-react"
import AddUnit from "@/components/addUnit"
import type { Unit } from "@/types"
import { getStatusColor } from "@/lib/utils"
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { redirect } from "next/navigation"

export default function SettingsPage() {
  const { user, getUserRole } = useAuth()

  // State/hooks must be declared unconditionally at the top
  const [units, setUnits] = useState<Unit[]>([])
  const [editingLevels, setEditingLevels] = useState<{
    [key: string]: { name: string; location: string; warning: number | null; high: number | null; critical: number | null } | undefined
  }>({})
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error"
    title: string
    message: string
  } | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  // Fetch all units from backend on mount
  const fetchUnits = async () => {
    try {
      const response = await AxiosInstance.get("/api/units")
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

  // Fetch user role from backend on mount
  useEffect(() => {
    const checkRole = async () => {
      if (user?.name) {
        const role = await getUserRole(user.name)
        setUserRole(role)
      }
      setIsCheckingRole(false)
    }
    checkRole()
  }, [user?.name, getUserRole])

  // Show loading while checking role
  if (isCheckingRole) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    )
  }

  // Only logged-in users can access settings (both admin and regular users)
  if (!user) {
    
    redirect('/login');
    
  }

  // Add unit handler


  // Alert level editing
  const initializeEditing = (unit: Unit) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unit.unit_id]: { 
        name: unit.name || "",
        location: unit.location || "",
        ...unit.alertLevels 
      },
    }))
  }

  const handleNameChange = (unitId: string, value: string) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || { name: "", location: "", warning: null, high: null, critical: null }),
        name: value,
      },
    }))
  }

  const handleLocationChange = (unitId: string, value: string) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || { name: "", location: "", warning: null, high: null, critical: null }),
        location: value,
      },
    }))
  }

  const handleLevelChange = (unitId: string, level: "warning" | "high" | "critical", value: string) => {
    setEditingLevels((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || { name: "", location: "", warning: null, high: null, critical: null }),
        [level]: value === "" ? null : Number.parseFloat(value),
      },
    }))
  }

  const handleSaveAlertLevels = async (unitId: string) => {
    if (editingLevels[unitId]) {
      try {
        const response = await AxiosInstance.put(`/api/updateUnitData/${unitId}`, {
          unit_id: unitId,
          name: editingLevels[unitId]?.name ?? "",
          location: editingLevels[unitId]?.location ?? "",
          alertLevels: {
            normal: null, // Add if you want to support normal level
            warning: editingLevels[unitId]?.warning ?? null,
            high: editingLevels[unitId]?.high ?? null,
            critical: editingLevels[unitId]?.critical ?? null
          },
          is_active: true // Add if backend requires this field
        })
        console.log("Update response:", response.data)
        setEditingLevels((prev) => ({ ...prev, [unitId]: undefined }))
        
        // Show success alert
        setAlertMessage({
          type: "success",
          title: "Success!",
          message: "Unit settings have been updated successfully."
        })
        
        fetchUnits() // Refresh data after save
      } catch (error) {
        console.error("Error saving alert levels:", error)
        
        // Show error alert
        setAlertMessage({
          type: "error",
          title: "Error!",
          message: "Failed to update unit settings. Please try again."
        })
      }

    }
  }
  

  return (
    <div className="space-y-6">
      {/* Alert Messages - Fixed position at top */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-5">
          <Alert 
            variant={alertMessage.type === "error" ? "destructive" : "default"} 
            className={
              alertMessage.type === "success" 
                ? "border-2 border-green-600 bg-green-50 text-green-900 shadow-lg" 
                : "border-2 border-red-600 bg-red-50 text-red-900 shadow-lg"
            }
          >
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertTitle className="font-semibold text-lg">
              {alertMessage.title}
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {alertMessage.message}
            </AlertDescription>
          </Alert>
        </div>
      )}


      <Card>
        <CardContent>
          <div className="space-y-8 mt-4">
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
                            <Label htmlFor={`name-${unit.unit_id}`} className="font-medium">
                              Set Name
                            </Label>
                            <Input
                              id={`name-${unit.unit_id}`}
                              type="text"
                              value={editingLevels[unit.unit_id]?.name ?? unit.name ?? ""}
                              onChange={(e) => handleNameChange(unit.unit_id, e.target.value)}
                              className="mt-2"
                            />
                            <p className="text-sm text-gray-500 mt-1">set a name for the unit</p>
                          </div>
                          <div>
                            <Label htmlFor={`location-${unit.unit_id}`} className="font-medium">
                              Set Location
                            </Label>
                            <Input
                              id={`location-${unit.unit_id}`}
                              type="text"
                              value={editingLevels[unit.unit_id]?.location ?? unit.location ?? ""}
                              onChange={(e) => handleLocationChange(unit.unit_id, e.target.value)}
                              className="mt-2"
                            />
                            <p className="text-sm text-gray-500 mt-1">set a location for the unit</p>
                          </div>
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