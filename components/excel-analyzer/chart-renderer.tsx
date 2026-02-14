"use client"

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { ChartConfig } from "./types"
import { CHART_COLORS } from "./types"

interface ChartRendererProps {
  data: Record<string, any>[]
  config: ChartConfig
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
}

export function ChartRenderer({ data, config }: ChartRendererProps) {
  if (!data.length) return null

  switch (config.type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xAxis} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {config.yAxis.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case "area":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xAxis} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {config.yAxis.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )

    case "bar":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xAxis} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {config.yAxis.map((key, index) => (
              <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case "pie": {
      const pieData = data.slice(0, 10).map((item, index) => ({
        name: item[config.xAxis],
        value: item[config.yAxis[0]],
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))

      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    default:
      return null
  }
}
