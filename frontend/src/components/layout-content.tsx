"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Navbar } from "@/components/navigation/navbar"
import { useUnitContext } from "@/context/unit-context"
import { AlertTriangle } from "lucide-react"
import { usePathname } from "next/navigation"
import type React from "react"

// Client component to use context for critical alerts
export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { criticalRising } = useUnitContext()
  const pathname = usePathname()
  
  // Hide navbar on login page
  const showNavbar = pathname !== '/login'

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <main className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {criticalRising > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Rise Detected</AlertTitle>
              <AlertDescription>
                {criticalRising} unit{criticalRising > 1 ? "s" : ""} showing rapid water level increase (≥10cm)
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
