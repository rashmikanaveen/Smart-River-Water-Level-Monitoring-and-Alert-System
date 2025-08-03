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
    id: "UNIT-001",
    name: "Bridge Station",
    location: "Ganges Bridge, Varanasi",
    currentLevel: 4.23,
    previousLevel: 4.18,
    changeInCm: 5,
    trend: "up",
    status: "normal",
    battery: 85,
    signal: 92,
    sensorStatus: "active",
    lastUpdate: "2m ago",
    alertLevels: {
      warning: 5.5,
      high: 6.5,
      critical: 7.5,
    },
    coordinates: { lat: 25.3176, lng: 82.9739 },
  },
  
]
