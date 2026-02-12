export const formatDate = (date: Date, format: string) => {
  if (format === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0]
  }
  if (format === "dd.MM") {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(date)
  }
  if (format === "dd.MM.yyyy") {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
  }
  if (format === "QQQ yyyy") {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear()}`
  }
  return date.toLocaleDateString("de-DE")
}

export const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const d = new Date(date)
  const day = d.getDay()
  const dayOfWeek = options?.weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day
  d.setDate(d.getDate() - dayOfWeek)
  d.setHours(0, 0, 0, 0)
  return d
}

export const endOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const start = startOfWeek(date, options)
  start.setDate(start.getDate() + 6)
  start.setHours(23, 59, 59, 999)
  return start
}

export const subWeeks = (date: Date, weeks: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() - weeks * 7)
  return d
}

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
export const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
export const subMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() - months); return d }
export const addMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d }

export const startOfQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1)
}
export const endOfQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
}
export const getQuarter = (date: Date) => Math.floor(date.getMonth() / 3) + 1
export const setQuarter = (date: Date, quarter: number) => { const d = new Date(date); d.setMonth((quarter - 1) * 3); return d }

export const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1)
export const endOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
export const subYears = (date: Date, years: number) => { const d = new Date(date); d.setFullYear(d.getFullYear() - years); return d }
export const addYears = (date: Date, years: number) => { const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d }

export const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
