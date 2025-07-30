import React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ArrowUp, ArrowDown, CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
      return "destructive"
    case "low":
      return "destructive"
    case "normal":
      return "default"
    default:
      return "secondary"
  }
}

export const getTrendIcon = (trend: string, changeInCm: number) => {
  if (trend === "up") {
    return changeInCm >= 10 ? (
      <ArrowUp className="h-4 w-4 text-red-600" />
    ) : (
      <ArrowUp className="h-4 w-4 text-orange-500" />
    )
  }
  return <ArrowDown className="h-4 w-4 text-blue-500" />
}

export const getChangeColor = (changeInCm: number, trend: string) => {
  if (trend === "up") {
    return changeInCm >= 10 ? "text-red-600" : "text-orange-500"
  }
  return "text-blue-500"
}

export const getSensorStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}