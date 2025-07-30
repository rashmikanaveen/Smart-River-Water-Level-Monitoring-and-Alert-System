import type { CustomTooltipProps } from "@/types"

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{`Date: ${label}`}</p>
        <p className="text-blue-600">{`Level: ${payload[0].value.toFixed(2)}m`}</p>
      </div>
    )
  }
  return null
}
