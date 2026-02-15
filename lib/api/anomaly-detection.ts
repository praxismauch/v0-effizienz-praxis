/**
 * Anomaly Detection System
 * Tracks request patterns and detects suspicious behavior
 */
import { getRedis } from "@/lib/redis"

export interface SecurityEvent {
  ip: string
  endpoint: string
  timestamp: number
  userAgent: string
  status: "allowed" | "blocked" | "captcha"
  reason?: string
}

export interface AnomalyAlert {
  type: "high_frequency" | "multiple_endpoints" | "suspicious_ua" | "repeated_blocks"
  ip: string
  severity: "low" | "medium" | "high"
  details: string
  timestamp: number
}

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

/**
 * Log a security event to Redis for analysis
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const redis = await getRedis()
    if (!redis) return

    const key = `security:events:${event.ip}`
    const score = event.timestamp
    const value = JSON.stringify(event)

    // Add to sorted set (sorted by timestamp)
    await redis.zadd(key, { score, member: value })

    // Set expiration to 7 days
    await redis.expire(key, SEVEN_DAYS_SECONDS)

    // Also track by endpoint
    const endpointKey = `security:endpoint:${event.endpoint}`
    await redis.zincrby(endpointKey, 1, event.ip)
    await redis.expire(endpointKey, SEVEN_DAYS_SECONDS)
  } catch (error) {
    console.error("[v0] Failed to log security event:", error)
  }
}

/**
 * Get recent security events for an IP
 */
export async function getRecentEvents(
  ip: string,
  minutes: number = 60
): Promise<SecurityEvent[]> {
  try {
    const redis = await getRedis()
    if (!redis) return []

    const key = `security:events:${ip}`
    const minScore = Date.now() - minutes * 60 * 1000

    const events = await redis.zrangebyscore(key, minScore, "+inf")
    return events.map((e) => JSON.parse(e))
  } catch (error) {
    console.error("[v0] Failed to get recent events:", error)
    return []
  }
}

/**
 * Detect anomalies in request patterns
 */
export async function detectAnomalies(ip: string): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = []
  const recentEvents = await getRecentEvents(ip, 60)

  if (recentEvents.length === 0) return alerts

  // 1. High frequency requests (>100 in last hour)
  if (recentEvents.length > 100) {
    alerts.push({
      type: "high_frequency",
      ip,
      severity: "high",
      details: `${recentEvents.length} requests in last hour`,
      timestamp: Date.now(),
    })
  }

  // 2. Multiple endpoints accessed (potential scanning)
  const uniqueEndpoints = new Set(recentEvents.map((e) => e.endpoint))
  if (uniqueEndpoints.size > 20) {
    alerts.push({
      type: "multiple_endpoints",
      ip,
      severity: "medium",
      details: `Accessed ${uniqueEndpoints.size} different endpoints`,
      timestamp: Date.now(),
    })
  }

  // 3. Suspicious user agent patterns
  const suspiciousUA = recentEvents.some((e) =>
    /curl|postman|python|bot|scanner/i.test(e.userAgent)
  )
  if (suspiciousUA && recentEvents.length > 10) {
    alerts.push({
      type: "suspicious_ua",
      ip,
      severity: "medium",
      details: "Automated tool detected with high request volume",
      timestamp: Date.now(),
    })
  }

  // 4. Repeated rate limit blocks
  const blockedCount = recentEvents.filter((e) => e.status === "blocked").length
  if (blockedCount > 10) {
    alerts.push({
      type: "repeated_blocks",
      ip,
      severity: "high",
      details: `${blockedCount} rate limit blocks in last hour`,
      timestamp: Date.now(),
    })
  }

  return alerts
}

/**
 * Check if IP should be escalated (stricter rate limits)
 */
export async function shouldEscalateIP(ip: string): Promise<boolean> {
  const alerts = await detectAnomalies(ip)
  return alerts.some((a) => a.severity === "high")
}

/**
 * Get IP block status
 */
export async function getIPBlockStatus(ip: string): Promise<{
  blocked: boolean
  reason?: string
  expiresAt?: number
}> {
  try {
    const redis = await getRedis()
    if (!redis) return { blocked: false }

    const blockKey = `security:block:${ip}`
    const blockData = await redis.get(blockKey)

    if (!blockData) return { blocked: false }

    const parsed = JSON.parse(blockData)
    return {
      blocked: true,
      reason: parsed.reason,
      expiresAt: parsed.expiresAt,
    }
  } catch (error) {
    console.error("[v0] Failed to check IP block status:", error)
    return { blocked: false }
  }
}

/**
 * Block an IP address temporarily
 */
export async function blockIP(
  ip: string,
  reason: string,
  durationSeconds: number = 3600
): Promise<void> {
  try {
    const redis = await getRedis()
    if (!redis) return

    const blockKey = `security:block:${ip}`
    const expiresAt = Date.now() + durationSeconds * 1000

    await redis.setex(
      blockKey,
      durationSeconds,
      JSON.stringify({ reason, expiresAt, blockedAt: Date.now() })
    )

    console.log(`[v0] Blocked IP ${ip} for ${durationSeconds}s: ${reason}`)
  } catch (error) {
    console.error("[v0] Failed to block IP:", error)
  }
}

/**
 * Get security analytics summary
 */
export async function getSecurityAnalytics(hours: number = 24): Promise<{
  totalRequests: number
  blockedRequests: number
  captchaRequests: number
  topIPs: Array<{ ip: string; count: number }>
  topEndpoints: Array<{ endpoint: string; count: number }>
  alerts: AnomalyAlert[]
}> {
  try {
    const redis = await getRedis()
    if (!redis) {
      return {
        totalRequests: 0,
        blockedRequests: 0,
        captchaRequests: 0,
        topIPs: [],
        topEndpoints: [],
        alerts: [],
      }
    }

    // Get all IP event keys
    const ipKeys = await redis.keys("security:events:*")
    const minScore = Date.now() - hours * 60 * 60 * 1000

    let totalRequests = 0
    let blockedRequests = 0
    let captchaRequests = 0
    const ipCounts: Map<string, number> = new Map()
    const endpointCounts: Map<string, number> = new Map()
    const allAlerts: AnomalyAlert[] = []

    for (const key of ipKeys) {
      const ip = key.replace("security:events:", "")
      const events = await redis.zrangebyscore(key, minScore, "+inf")
      const parsed: SecurityEvent[] = events.map((e) => JSON.parse(e))

      totalRequests += parsed.length
      blockedRequests += parsed.filter((e) => e.status === "blocked").length
      captchaRequests += parsed.filter((e) => e.status === "captcha").length

      ipCounts.set(ip, parsed.length)

      parsed.forEach((e) => {
        endpointCounts.set(e.endpoint, (endpointCounts.get(e.endpoint) || 0) + 1)
      })

      // Check for anomalies
      const alerts = await detectAnomalies(ip)
      allAlerts.push(...alerts)
    }

    // Sort and get top IPs
    const topIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // Sort and get top endpoints
    const topEndpoints = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))

    return {
      totalRequests,
      blockedRequests,
      captchaRequests,
      topIPs,
      topEndpoints,
      alerts: allAlerts,
    }
  } catch (error) {
    console.error("[v0] Failed to get security analytics:", error)
    return {
      totalRequests: 0,
      blockedRequests: 0,
      captchaRequests: 0,
      topIPs: [],
      topEndpoints: [],
      alerts: [],
    }
  }
}
