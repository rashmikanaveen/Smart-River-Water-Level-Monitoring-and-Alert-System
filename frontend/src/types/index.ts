import type { LucideIcon } from "lucide-react"

export interface Unit {
  unit_id: string
  name: string
  location: string
  normalLevelCm?: number
  highLevelCm?: number
  criticalLevelCm?: number
  changeInCm?: number
  trend: "up" | "down"|"stable"
  status: "normal" | "critical" | "low"
  battery: number
  signal: number
  sensorStatus: "active" | "warning" | "error"
  alertLevels: {
    warning: number
    high: number
    critical: number
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
