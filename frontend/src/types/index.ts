import type { LucideIcon } from "lucide-react"

export interface Unit {
  id: string
  name: string
  location: string
  currentLevel: number
  previousLevel: number
  changeInCm: number
  trend: "up" | "down"
  status: "normal" | "critical" | "low"
  battery: number
  signal: number
  sensorStatus: "active" | "warning" | "error"
  lastUpdate: string
  alertLevels: {
    warning: number
    high: number
    critical: number
  }
  coordinates: {
    lat: number
    lng: number
  }
}

export interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
}

export interface ChartData {
  date: string
  level: number
}

export interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}
