"use client"

import { memo } from "react"

interface BarChartData {
  day: string
  completed: number
  pending: number
}

interface LineChartData {
  time: string
  appointments: number
}

interface AreaChartData {
  date: string
  value: number
}

export const BarChart = memo(function BarChart({ data }: { data: BarChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">Keine Daten verfügbar</div>
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.completed, d.pending]), 1)

  return (
    <div className="h-40 flex items-end justify-around gap-2 px-4">
      {data.map((item, index) => {
        const completedHeight = ((item.completed || 0) / maxValue) * 100
        const pendingHeight = ((item.pending || 0) / maxValue) * 100

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-1 items-end h-48">
              <div
                className="flex-1 bg-primary rounded-t transition-all hover:opacity-80"
                style={{ height: `${completedHeight}%` }}
                title={`Erledigt: ${item.completed}`}
              />
              <div
                className="flex-1 bg-muted rounded-t transition-all hover:opacity-80"
                style={{ height: `${pendingHeight}%` }}
                title={`Ausstehend: ${item.pending}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.day}</span>
          </div>
        )
      })}
    </div>
  )
})

export const LineChart = memo(function LineChart({ data }: { data: LineChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">Keine Daten verfügbar</div>
  }

  const maxValue = Math.max(...data.map((d) => d.appointments), 1)
  const points = data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100
      const y = 100 - ((item.appointments || 0) / maxValue) * 80
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="h-64 relative px-4">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((item, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * 100
          const y = 100 - ((item.appointments || 0) / maxValue) * 80
          if (isNaN(x) || isNaN(y)) return null

          return (
            <circle key={index} cx={x} cy={y} r="1.5" fill="hsl(var(--primary))" className="hover:r-2 transition-all">
              <title>{`${item.time}: ${item.appointments} Termine`}</title>
            </circle>
          )
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-muted-foreground">
            {item.time}
          </span>
        ))}
      </div>
    </div>
  )
})

export const AreaChart = memo(function AreaChart({ data }: { data: AreaChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">Keine Daten verfügbar</div>
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - (item.value / maxValue) * 80
      return `${x},${y}`
    })
    .join(" ")

  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="h-64 relative px-4">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-muted-foreground">
            {item.date}
          </span>
        ))}
      </div>
    </div>
  )
})
