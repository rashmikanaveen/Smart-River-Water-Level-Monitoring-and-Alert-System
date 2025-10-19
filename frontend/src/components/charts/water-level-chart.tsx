import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from "recharts"
import { CustomTooltip } from "./custom-tooltip"
import type { ChartData } from "@/types"

interface WaterLevelChartProps {
  data: ChartData[]
  height?: string
  alertLevels?: {
    normal?: number
    warning?: number
    high?: number
    critical?: number
  }
}

export const WaterLevelChart = ({ 
  data, 
  height = "h-64 sm:h-80 lg:h-96",
  alertLevels 
}: WaterLevelChartProps) => {
  // Convert alert levels from meters to centimeters
  const alertLevelsInCm = alertLevels ? {
    normal: alertLevels.normal ? alertLevels.normal * 100 : undefined,
    warning: alertLevels.warning ? alertLevels.warning * 100 : undefined,
    high: alertLevels.high ? alertLevels.high * 100 : undefined,
    critical: alertLevels.critical ? alertLevels.critical * 100 : undefined,
  } : undefined;

  // Debug log
  console.log("📊 Chart Alert Levels (input):", alertLevels);
  console.log("📊 Chart Alert Levels (in cm):", alertLevelsInCm);

  // Calculate the domain for Y-axis to center around normal level
  const normalLevel = alertLevelsInCm?.normal || 0;
  const dataValues = data.map(d => d.level).filter(level => level > 0); // Filter out error values (0)
  
  // Calculate the range of actual data (excluding errors)
  const dataMin = dataValues.length > 0 ? Math.min(...dataValues) : normalLevel;
  const dataMax = dataValues.length > 0 ? Math.max(...dataValues) : normalLevel;
  const dataRange = dataMax - dataMin;
  
  // Adjust padding based on variation - smaller variation = tighter view
  const padding = dataRange < 5 ? 3 : dataRange < 10 ? 5 : dataRange < 20 ? 10 : 20;
  
  // Include all alert levels in the domain calculation
  const allLevels = [
    dataMin,
    dataMax,
    alertLevelsInCm?.normal,
    alertLevelsInCm?.warning,
    alertLevelsInCm?.high,
    alertLevelsInCm?.critical
  ].filter((level): level is number => level !== undefined && level > 0);
  
  // Calculate domain to show all relevant levels
  const minValue = Math.max(0, Math.min(...allLevels) - padding);
  const maxValue = Math.max(...allLevels) + padding;

  return (
    <div className={`w-full ${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 80,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={(props: any) => {
              const { x, y, payload } = props;
              // Find the data point for this date
              const dataPoint = data.find(d => d.date === payload.value);
              const isError = dataPoint?.level === 0;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    fill={isError ? "#ef4444" : "#666"}
                    fontSize={12}
                    fontWeight={isError ? "bold" : "normal"}
                    transform="rotate(-45)"
                  >
                    {payload.value}
                  </text>
                </g>
              );
            }}
            tickLine={{ stroke: "#ccc" }} 
            axisLine={{ stroke: "#ccc" }}
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={{ stroke: "#ccc" }} 
            axisLine={{ stroke: "#ccc" }} 
            width={70}
            label={{ value: 'Water Level (cm)', angle: -90, position: 'insideLeft' }}
            domain={[minValue, maxValue]}
            reversed={true}
            tickFormatter={(value) => `${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Normal Level Reference Line - Main baseline in GREEN */}
          {alertLevelsInCm?.normal !== undefined && alertLevelsInCm.normal >= 0 && (
            <>
              <ReferenceLine 
                key="normal-line"
                y={alertLevelsInCm.normal} 
                stroke="#16a34a" 
                strokeWidth={2.5}
                strokeDasharray="0"
              />
              {/* Right side label */}
              <ReferenceLine 
                key="normal-label-right"
                y={alertLevelsInCm.normal}
                stroke="transparent"
                label={{ 
                  value: `${alertLevelsInCm.normal.toFixed(1)}cm`, 
                  position: 'right', 
                  fill: '#16a34a', 
                  fontSize: 14, 
                  fontWeight: 'bold',
                }}
              />
              {/* Left side label */}
              <ReferenceLine 
                key="normal-label-left"
                y={alertLevelsInCm.normal}
                stroke="transparent"
                label={{ 
                  value: `${alertLevelsInCm.normal.toFixed(1)}cm`, 
                  position: 'insideTopLeft', 
                  fill: '#16a34a', 
                  fontSize: 14, 
                  fontWeight: 'bold',
                }}
              />
            </>
          )}
          
          {/* Warning Level - Below normal means water rising */}
          {alertLevelsInCm?.warning !== undefined && alertLevelsInCm.warning >= 0 && (
            <ReferenceLine 
              key="warning-line"
              y={alertLevelsInCm.warning} 
              stroke="#eab308" 
              strokeDasharray="5 5" 
              label={{ value: `(${alertLevelsInCm.warning.toFixed(1)}cm)`, position: 'right', fill: '#eab308', fontSize: 12 }}
            />
          )}
          
          {/* High Level */}
          {alertLevelsInCm?.high !== undefined && alertLevelsInCm.high >= 0 && (
            <ReferenceLine 
              key="high-line"
              y={alertLevelsInCm.high} 
              stroke="#f97316" 
              strokeDasharray="5 5" 
              label={{ value: `(${alertLevelsInCm.high.toFixed(1)}cm)`, position: 'right', fill: '#f97316', fontSize: 12 }}
            />
          )}
          
          {/* Critical Level */}
          {alertLevelsInCm?.critical !== undefined && alertLevelsInCm.critical >= 0 && (
            <ReferenceLine 
              key="critical-line"
              y={alertLevelsInCm.critical} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              label={{ value: `(${alertLevelsInCm.critical.toFixed(1)}cm)`, position: 'right', fill: '#ef4444', fontSize: 12 }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="level"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              const isError = payload.level === 0;
              return (
                <circle
                  key={`dot-${index}-${payload.date}`}
                  cx={cx}
                  cy={cy}
                  r={isError ? 6 : 4}
                  fill={isError ? "#ef4444" : "#3b82f6"}
                  stroke={isError ? "#dc2626" : "#3b82f6"}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            name="Distance from Sensor"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
