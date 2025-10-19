import type { CustomTooltipProps } from "@/types"

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isError = value === 0;
    
    return (
      <div className={`p-3 border rounded-lg shadow-lg ${isError ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
        <p className="font-medium">{`Date: ${label}`}</p>
        {isError ? (
          <>
            <p className="text-red-600 font-bold">⚠ SENSOR ERROR</p>
            <p className="text-red-500 text-sm">No valid reading</p>
          </>
        ) : (
          <p className="text-blue-600">{`Level: ${value.toFixed(2)}cm`}</p>
        )}
      </div>
    )
  }
  return null
}
