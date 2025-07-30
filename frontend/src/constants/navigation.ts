import { Home, Eye, Cog, Map, BarChart3 } from "lucide-react"
import type { NavigationItem } from "@/types"

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "details", label: "Details", icon: Eye },
  { id: "settings", label: "Settings", icon: Cog },
  { id: "map", label: "Map", icon: Map },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
]
