import type { Unit, ChartData } from "@/types"

export const generateMockData = (): ChartData[] => {
  const data: ChartData[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      level: Math.random() * 3 + 3,
    })
  }
  return data
}

export const mockUnits: Unit[] = [
  {
    unit_id: "001",
    name: "Bridge Station",
    location: "Ganges Bridge, Varanasi",
    changeInCm: 5,
    trend: "up",
    status: "normal",
    battery: 85,
    signal: 92,
    sensorStatus: "active",
    alertLevels: {
      warning: 5.5,
      high: 6.4,
      critical: 7.5,
    },
    
  },
  
]
