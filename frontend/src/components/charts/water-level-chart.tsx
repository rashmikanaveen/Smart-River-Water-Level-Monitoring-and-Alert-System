import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { CustomTooltip } from "./custom-tooltip"
import type { ChartData } from "@/types"

interface WaterLevelChartProps {
  data: ChartData[]
  height?: string
}

export const WaterLevelChart = ({ data, height = "h-64 sm:h-80 lg:h-96" }: WaterLevelChartProps) => {
  return (
    <div className={`w-full ${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={{ stroke: "#ccc" }} axisLine={{ stroke: "#ccc" }} />
          <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#ccc" }} axisLine={{ stroke: "#ccc" }} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
