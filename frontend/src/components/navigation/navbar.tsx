"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Activity, ArrowUp, Cloud, Bell, Menu } from "lucide-react"
import { navigationItems } from "@/lib/constants"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUnitContext } from "@/context/unit-context"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect } from "react"

export const Navbar = () => {
  const pathname = usePathname()
  const { risingCount } = useUnitContext()
  const { user, getUserRole } = useAuth()
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)

  // Fetch user role when user changes
  useEffect(() => {
    const fetchRole = async () => {
      if (user?.name) {
        const role = await getUserRole(user.name)
        setUserRole(role)
      } else {
        setUserRole(null)
      }
    }
    fetchRole()
  }, [user?.name, getUserRole])

  // Filter navigation items based on auth requirements and user role
  const visibleNavItems = navigationItems.filter(item => {
    // If auth is null, item is public - show to everyone
    if (item.auth === null) {
      return true
    }
    // If auth is required but no user is logged in, hide the item
    if (item.auth && !user) {
      return false
    }
    // If user is logged in and auth is required, check if user's role is in the allowed roles
    if (item.auth && user && userRole) {
      return item.auth.includes(userRole)
    }
    return false
  })

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">River Monitor</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Real-time monitoring system</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === `/${item.id}` || (item.id === "dashboard" && pathname === "/")
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  asChild
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Link href={`/${item.id}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Mobile Navigation + Status */}
          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              {risingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse hidden sm:flex">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {risingCount} Rising
                </Badge>
              )}

              {/*<Card className="p-2 hidden md:block">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-semibold">28°C</div>
                  </div>
                </div>
              </Card>

              <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                <Bell className="h-4 w-4 mr-2" />
                Alerts ({risingCount})
              </Button>*/}
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border-2 border-gray-200 shadow-lg">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === `/${item.id}` || (item.id === "dashboard" && pathname === "/")
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        asChild
                        className={`flex items-center gap-2 cursor-pointer ${
                          isActive ? "bg-blue-50 text-blue-700" : ""
                        }`}
                      >
                        <Link href={`/${item.id}`}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
