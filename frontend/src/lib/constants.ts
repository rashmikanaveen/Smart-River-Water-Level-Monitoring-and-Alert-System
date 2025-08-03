import { Home, Eye, Cog, Map, BarChart3 } from "lucide-react"
import type { NavigationItem } from "@/types"

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "details", label: "Details", icon: Eye },
  { id: "settings", label: "Settings", icon: Cog },
  
]
