/**
 * Unit tests for anomaly detection system
 * Run with: npx jest lib/api/__tests__/anomaly-detection.test.ts
 */
import type { SecurityEvent, AnomalyAlert } from "../anomaly-detection"

// Mock Redis data store
const mockRedisData = new Map<string, unknown>()
const mockSortedSets = new Map<string, Array<{ score: number; member: string }>>()

jest.mock("@/lib/redis", () => ({
  getRedis: jest.fn().mockResolvedValue({
    zadd: jest.fn((key: string, item: { score: number; member: string }) => {
      if (!mockSortedSets.has(key)) mockSortedSets.set(key, [])
      mockSortedSets.get(key)!.push(item)
      return Promise.resolve(1)
    }),
    zrangebyscore: jest.fn((key: string, min: number, _max: string) => {
      const set = mockSortedSets.get(key) || []
      return Promise.resolve(
        set.filter((item) => item.score >= min).map((item) => item.member)
      )
    }),
    zincrby: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
    get: jest.fn((key: string) => Promise.resolve(mockRedisData.get(key) || null)),
    setex: jest.fn((key: string, _ttl: number, value: unknown) => {
      mockRedisData.set(key, value)
      return Promise.resolve("OK")
    }),
    keys: jest.fn((pattern: string) => {
      const prefix = pattern.replace("*", "")
      const matching = Array.from(mockSortedSets.keys()).filter((k) => k.startsWith(prefix))
      return Promise.resolve(matching)
    }),
  }),
}))

import {
  logSecurityEvent,
  getRecentEvents,
  detectAnomalies,
  shouldEscalateIP,
  getIPBlockStatus,
  blockIP,
  getSecurityAnalytics,
} from "../anomaly-detection"

beforeEach(() => {
  mockRedisData.clear()
  mockSortedSets.clear()
})

describe("Anomaly Detection System", () => {
  describe("logSecurityEvent", () => {
    it("should log an event to Redis sorted set", async () => {
      const event: SecurityEvent = {
        ip: "192.168.1.1",
        endpoint: "/api/test",
        timestamp: Date.now(),
        userAgent: "Mozilla/5.0",
        status: "allowed",
      }

      await logSecurityEvent(event)

      const key = "security:events:192.168.1.1"
      expect(mockSortedSets.has(key)).toBe(true)
      expect(mockSortedSets.get(key)!.length).toBe(1)
    })

    it("should accumulate multiple events for the same IP", async () => {
      const baseEvent: SecurityEvent = {
        ip: "192.168.1.1",
        endpoint: "/api/test",
        timestamp: Date.now(),
        userAgent: "Mozilla/5.0",
        status: "allowed",
      }

      await logSecurityEvent(baseEvent)
      await logSecurityEvent({ ...baseEvent, endpoint: "/api/other", timestamp: Date.now() + 1000 })
      await logSecurityEvent({ ...baseEvent, status: "blocked", timestamp: Date.now() + 2000 })

      const key = "security:events:192.168.1.1"
      expect(mockSortedSets.get(key)!.length).toBe(3)
    })
  })

  describe("detectAnomalies", () => {
    it("should return no alerts for an IP with no events", async () => {
      const alerts = await detectAnomalies("10.0.0.1")
      expect(alerts).toEqual([])
    })

    it("should detect high frequency requests", async () => {
      const key = "security:events:10.0.0.2"
      const events: Array<{ score: number; member: string }> = []

      // Add 105 events in the last hour
      for (let i = 0; i < 105; i++) {
        const event: SecurityEvent = {
          ip: "10.0.0.2",
          endpoint: "/api/test",
          timestamp: Date.now() - i * 1000,
          userAgent: "Mozilla/5.0",
          status: "allowed",
        }
        events.push({ score: event.timestamp, member: JSON.stringify(event) })
      }
      mockSortedSets.set(key, events)

      const alerts = await detectAnomalies("10.0.0.2")
      const highFreq = alerts.find((a) => a.type === "high_frequency")

      expect(highFreq).toBeTruthy()
      expect(highFreq!.severity).toBe("high")
    })

    it("should detect suspicious user agents", async () => {
      const key = "security:events:10.0.0.3"
      const events: Array<{ score: number; member: string }> = []

      // Add 15 events with curl user agent
      for (let i = 0; i < 15; i++) {
        const event: SecurityEvent = {
          ip: "10.0.0.3",
          endpoint: "/api/test",
          timestamp: Date.now() - i * 1000,
          userAgent: "curl/7.88.1",
          status: "allowed",
        }
        events.push({ score: event.timestamp, member: JSON.stringify(event) })
      }
      mockSortedSets.set(key, events)

      const alerts = await detectAnomalies("10.0.0.3")
      const suspUA = alerts.find((a) => a.type === "suspicious_ua")

      expect(suspUA).toBeTruthy()
      expect(suspUA!.severity).toBe("medium")
    })

    it("should detect repeated rate limit blocks", async () => {
      const key = "security:events:10.0.0.4"
      const events: Array<{ score: number; member: string }> = []

      // Add 12 blocked events
      for (let i = 0; i < 12; i++) {
        const event: SecurityEvent = {
          ip: "10.0.0.4",
          endpoint: "/api/test",
          timestamp: Date.now() - i * 1000,
          userAgent: "Mozilla/5.0",
          status: "blocked",
          reason: "rate_limit_exceeded",
        }
        events.push({ score: event.timestamp, member: JSON.stringify(event) })
      }
      mockSortedSets.set(key, events)

      const alerts = await detectAnomalies("10.0.0.4")
      const repeated = alerts.find((a) => a.type === "repeated_blocks")

      expect(repeated).toBeTruthy()
      expect(repeated!.severity).toBe("high")
    })

    it("should detect endpoint scanning", async () => {
      const key = "security:events:10.0.0.5"
      const events: Array<{ score: number; member: string }> = []

      // Access 25 different endpoints
      for (let i = 0; i < 25; i++) {
        const event: SecurityEvent = {
          ip: "10.0.0.5",
          endpoint: `/api/endpoint-${i}`,
          timestamp: Date.now() - i * 1000,
          userAgent: "Mozilla/5.0",
          status: "allowed",
        }
        events.push({ score: event.timestamp, member: JSON.stringify(event) })
      }
      mockSortedSets.set(key, events)

      const alerts = await detectAnomalies("10.0.0.5")
      const scanning = alerts.find((a) => a.type === "multiple_endpoints")

      expect(scanning).toBeTruthy()
      expect(scanning!.severity).toBe("medium")
    })
  })

  describe("shouldEscalateIP", () => {
    it("should not escalate IP with no alerts", async () => {
      const result = await shouldEscalateIP("10.0.0.10")
      expect(result).toBe(false)
    })
  })

  describe("blockIP / getIPBlockStatus", () => {
    it("should block an IP and retrieve block status", async () => {
      await blockIP("10.0.0.20", "Test block", 3600)

      const status = await getIPBlockStatus("10.0.0.20")
      expect(status.blocked).toBe(true)
      expect(status.reason).toBe("Test block")
    })

    it("should return not blocked for unknown IP", async () => {
      const status = await getIPBlockStatus("10.0.0.99")
      expect(status.blocked).toBe(false)
      expect(status.reason).toBeUndefined()
    })
  })

  describe("getSecurityAnalytics", () => {
    it("should return empty analytics when no events exist", async () => {
      const analytics = await getSecurityAnalytics(24)

      expect(analytics.totalRequests).toBe(0)
      expect(analytics.blockedRequests).toBe(0)
      expect(analytics.captchaRequests).toBe(0)
      expect(analytics.topIPs).toEqual([])
      expect(analytics.topEndpoints).toEqual([])
    })

    it("should aggregate events correctly", async () => {
      const key = "security:events:10.0.0.30"
      const events: Array<{ score: number; member: string }> = []

      // 3 allowed, 2 blocked, 1 captcha
      const statuses: Array<"allowed" | "blocked" | "captcha"> = [
        "allowed", "allowed", "allowed", "blocked", "blocked", "captcha",
      ]

      statuses.forEach((status, i) => {
        const event: SecurityEvent = {
          ip: "10.0.0.30",
          endpoint: "/api/test",
          timestamp: Date.now() - i * 1000,
          userAgent: "Mozilla/5.0",
          status,
        }
        events.push({ score: event.timestamp, member: JSON.stringify(event) })
      })
      mockSortedSets.set(key, events)

      const analytics = await getSecurityAnalytics(24)

      expect(analytics.totalRequests).toBe(6)
      expect(analytics.blockedRequests).toBe(2)
      expect(analytics.captchaRequests).toBe(1)
      expect(analytics.topIPs.length).toBe(1)
      expect(analytics.topIPs[0].ip).toBe("10.0.0.30")
      expect(analytics.topIPs[0].count).toBe(6)
    })
  })
})
