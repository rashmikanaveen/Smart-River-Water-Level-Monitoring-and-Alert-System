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
  {
    id: "UNIT-002",
    name: "Main River",
    location: "Yamuna Confluence",
    currentLevel: 7.87,
    previousLevel: 7.74,
    changeInCm: 13,
    trend: "up",
    status: "critical",
    battery: 45,
    signal: 78,
    sensorStatus: "active",
    lastUpdate: "1m ago",
    alertLevels: {
      warning: 6.0,
      high: 7.0,
      critical: 8.0,
    },
    coordinates: { lat: 25.4358, lng: 81.8463 },
  },
  {
    id: "UNIT-003",
    name: "Tributary",
    location: "Tributary Monitor Point",
    currentLevel: 1.19,
    previousLevel: 1.82,
    changeInCm: -63,
    trend: "down",
    status: "low",
    battery: 92,
    signal: 65,
    sensorStatus: "warning",
    lastUpdate: "5m ago",
    alertLevels: {
      warning: 0.8,
      high: 0.5,
      critical: 0.3,
    },
    coordinates: { lat: 25.2867, lng: 82.9547 },
  },
  {
    id: "UNIT-004",
    name: "Upstream",
    location: "Upstream Monitor Station",
    currentLevel: 3.45,
    previousLevel: 3.42,
    changeInCm: 3,
    trend: "up",
    status: "normal",
    battery: 78,
    signal: 88,
    sensorStatus: "active",
    lastUpdate: "3m ago",
    alertLevels: {
      warning: 4.0,
      high: 5.0,
      critical: 6.0,
    },
    coordinates: { lat: 25.3567, lng: 82.8947 },
  },
]
