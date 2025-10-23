import { Home, Eye, Cog, Map, BarChart3, Shield } from "lucide-react"
import type { NavigationItem } from "@/types"

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, auth: null },
  { id: "details", label: "Details", icon: Eye, auth: null },
  { id: "settings", label: "Settings", icon: Cog, auth: ['user', 'admin'] },
  { id: "admin", label: "Admin", icon: Shield, auth: ['admin'] },
]
