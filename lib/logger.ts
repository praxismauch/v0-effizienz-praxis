type LogLevel = "debug" | "info" | "warn" | "error"
type LogCategory = "api" | "context" | "auth" | "database" | "supabase" | "ui" | "cron" | "email" | "ai" | "middleware" | "security" | "performance" | "other"

// Error tracking queue for batching
interface ErrorTrackingEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, unknown>
  userAgent?: string
  url?: string
}

const errorTrackingQueue: ErrorTrackingEntry[] = []
const ERROR_TRACKING_BATCH_SIZE = 10
const ERROR_TRACKING_FLUSH_INTERVAL = 30000 // 30 seconds

interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  details?: Record<string, any>
  userId?: string
  practiceId?: string
  requestId?: string
  url?: string
  method?: string
  stackTrace?: string
  duration?: number
  timestamp?: string
}

interface StructuredLog {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  requestId?: string
  userId?: string
  practiceId?: string
  duration?: number
  details?: Record<string, any>
  error?: {
    name?: string
    message?: string
    stack?: string
  }
}

function checkIsProduction(): boolean {
  if (typeof window !== "undefined") {
    const vercelEnv = typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_VERCEL_ENV : undefined
    return vercelEnv === "production"
  }
  return typeof process !== "undefined" && process.env && process.env.NODE_ENV === "production"
}

function checkIsDevelopment(): boolean {
  if (typeof window !== "undefined") {
    const vercelEnv = typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_VERCEL_ENV : undefined
    return !vercelEnv || vercelEnv === "development" || vercelEnv === "preview"
  }
  return typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development"
}

const LOG_COLORS = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m",
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLogLevel(): LogLevel {
  if (checkIsProduction()) return "info" // Don't log debug in production
  return "debug"
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "session",
  "credential",
  "private_key",
  "access_token",
  "refresh_token",
  "supabase_service_role_key",
  "encryption_key",
])

function sanitizeLogData(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data) return data

  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.has(lowerKey) || Array.from(SENSITIVE_KEYS).some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === "object" && item !== null ? sanitizeLogData(item) : item))
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
  }

  end(): number {
    return Math.round(performance.now() - this.startTime)
  }

  endAndLog(category: LogCategory, details?: Record<string, any>) {
    const duration = this.end()
    Logger.info(category, `${this.label} completed`, { ...details, duration: `${duration}ms` })
    return duration
  }
}

class Logger {
  private static requestId: string | null = null
  private static isLogging = false
  private static logBlacklist = ["/api/logs", "/api/settings"]

  static setRequestId(id: string) {
    this.requestId = id
  }

  static generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  static startTimer(label: string): PerformanceTimer {
    return new PerformanceTimer(label)
  }

  private static formatStructuredLog(entry: LogEntry, error?: Error): string {
    const structured: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      category: entry.category,
      message: entry.message,
      requestId: entry.requestId || this.requestId || undefined,
      userId: entry.userId,
      practiceId: entry.practiceId,
      duration: entry.duration,
      details: sanitizeLogData(entry.details),
    }

    if (error) {
      structured.error = {
        name: error.name,
        message: error.message,
        stack: checkIsDevelopment() ? error.stack : undefined,
      }
    }

    return JSON.stringify(structured)
  }

  private static formatDevLog(entry: LogEntry, error?: Error): string {
    const color = LOG_COLORS[entry.level]
    const reset = LOG_COLORS.reset
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`
    const category = `[${entry.category}]`
    const reqId = entry.requestId || this.requestId ? ` (${(entry.requestId || this.requestId)?.substring(0, 8)})` : ""

    let output = `${timestamp} ${prefix} ${category}${reqId} ${entry.message}`

    if (entry.duration) {
      output += ` (${entry.duration}ms)`
    }

    return output
  }

  private static shouldLog(level: LogLevel): boolean {
    const minLevel = getMinLogLevel()
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
  }

  private static logToConsole(entry: LogEntry, error?: Error) {
    if (!this.shouldLog(entry.level)) return

    const IS_PRODUCTION = checkIsProduction()
    const IS_DEVELOPMENT = checkIsDevelopment()

    if (typeof window === "undefined") {
      // Server-side logging
      if (IS_PRODUCTION) {
        // JSON structured output for production (parsed by log aggregators)
        console.log(this.formatStructuredLog(entry, error))
      } else if (IS_DEVELOPMENT) {
        // Colored output for development
        const formatted = this.formatDevLog(entry, error)
        const details = entry.details ? sanitizeLogData(entry.details) : undefined

        switch (entry.level) {
          case "debug":
            console.debug(formatted, details || "")
            break
          case "info":
            console.info(formatted, details || "")
            break
          case "warn":
            console.warn(formatted, details || "")
            break
          case "error":
            console.error(formatted, details || "", error?.stack || "")
            break
        }
      }
    }
  }

  private static async sendLog(entry: LogEntry, error?: Error) {
    // Always log to console first
    this.logToConsole(entry, error)

    // Client-side: also send to log API
    if (typeof window === "undefined") return
    if (this.isLogging) return
    if (checkIsProduction() && entry.level === "debug") return
    if (entry.url && this.logBlacklist.some((path) => entry.url?.includes(path))) return

    const sanitizedEntry = {
      ...entry,
      details: sanitizeLogData(entry.details),
    }

    try {
      this.isLogging = true
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      if (typeof window !== "undefined" && window.location) {
        const baseUrl = window.location.origin
        await fetch(`${baseUrl}/api/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sanitizedEntry,
            requestId: entry.requestId || this.requestId,
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        })
      }

      clearTimeout(timeoutId)
    } catch {
      // Silent fail
    } finally {
      this.isLogging = false
    }
  }

  static debug(category: LogCategory, message: string, details?: Record<string, any>) {
    this.sendLog({ level: "debug", category, message, details })
  }

  static info(category: LogCategory, message: string, details?: Record<string, any>) {
    this.sendLog({ level: "info", category, message, details })
  }

  static warn(category: LogCategory, message: string, details?: Record<string, any>) {
    this.sendLog({ level: "warn", category, message, details })
  }

  static error(category: LogCategory, message: string, error?: Error | any, details?: Record<string, any>) {
    this.sendLog(
      {
        level: "error",
        category,
        message,
        details: {
          ...details,
          error: error?.message,
          errorName: error?.name,
        },
        stackTrace: checkIsDevelopment() ? error?.stack : undefined,
      },
      error instanceof Error ? error : undefined,
    )
  }

  static request(method: string, url: string, statusCode: number, duration: number, details?: Record<string, any>) {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info"
    this.sendLog({
      level,
      category: "api",
      message: `${method} ${url} ${statusCode}`,
      method,
      url,
      duration,
      details: { ...details, statusCode },
    })
  }

  static query(operation: string, table: string, duration: number, details?: Record<string, any>) {
    this.sendLog({
      level: "debug",
      category: "database",
      message: `${operation} on ${table}`,
      duration,
      details,
    })
  }

  static ai(operation: string, model: string, duration: number, details?: Record<string, any>) {
    this.sendLog({
      level: "info",
      category: "ai",
      message: `AI ${operation} with ${model}`,
      duration,
      details,
    })
  }
}

// Error tracking functions
function addToErrorTrackingQueue(entry: ErrorTrackingEntry) {
  errorTrackingQueue.push(entry)
  
  if (errorTrackingQueue.length >= ERROR_TRACKING_BATCH_SIZE) {
    flushErrorTracking()
  }
}

async function flushErrorTracking() {
  if (errorTrackingQueue.length === 0) return
  
  const batch = errorTrackingQueue.splice(0, ERROR_TRACKING_BATCH_SIZE)
  
  try {
    if (typeof window !== "undefined" && window.location) {
      await fetch(`${window.location.origin}/api/error-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errors: batch }),
      }).catch(() => {
        // Silent fail - don't cause more errors while reporting errors
      })
    }
  } catch {
    // Silent fail
  }
}

// Setup periodic flush
if (typeof window !== "undefined") {
  setInterval(flushErrorTracking, ERROR_TRACKING_FLUSH_INTERVAL)
  
  // Flush on page unload
  window.addEventListener("beforeunload", () => {
    if (errorTrackingQueue.length > 0) {
      const batch = errorTrackingQueue.splice(0)
      navigator.sendBeacon?.(
        "/api/error-tracking",
        JSON.stringify({ errors: batch })
      )
    }
  })
}

// Global error handlers for uncaught errors
function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return
  
  // Uncaught errors
  window.addEventListener("error", (event) => {
    Logger.error("ui", "Uncaught error", event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
  
  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    Logger.error("ui", "Unhandled promise rejection", event.reason, {
      reason: String(event.reason),
    })
  })
}

// Initialize global handlers
if (typeof window !== "undefined") {
  setupGlobalErrorHandlers()
}

export default Logger
export { Logger, PerformanceTimer, flushErrorTracking, addToErrorTrackingQueue }
export type { LogLevel, LogCategory, LogEntry, StructuredLog, ErrorTrackingEntry }
