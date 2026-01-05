/**
 * Unit tests for rate limiting
 * Run with: npx jest lib/api/__tests__/rate-limit.test.ts
 */
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "../rate-limit"

describe("Rate Limiting", () => {
  describe("checkRateLimit", () => {
    it("should allow requests under limit", () => {
      const key = `test-${Date.now()}`
      const result = checkRateLimit(key, { limit: 5, windowSeconds: 60 })

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it("should track request count", () => {
      const key = `test-count-${Date.now()}`
      const config = { limit: 3, windowSeconds: 60 }

      checkRateLimit(key, config) // 1
      checkRateLimit(key, config) // 2
      const result = checkRateLimit(key, config) // 3

      expect(result.remaining).toBe(0)
    })

    it("should block after limit exceeded", () => {
      const key = `test-block-${Date.now()}`
      const config = { limit: 2, windowSeconds: 60 }

      checkRateLimit(key, config) // 1
      checkRateLimit(key, config) // 2
      const result = checkRateLimit(key, config) // 3 - should be blocked

      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeDefined()
    })
  })

  describe("getRateLimitKey", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      })
      const key = getRateLimitKey(request, "api")
      expect(key).toBe("api:192.168.1.1")
    })

    it("should fallback to x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-real-ip": "192.168.1.2" },
      })
      const key = getRateLimitKey(request, "auth")
      expect(key).toBe("auth:192.168.1.2")
    })

    it("should use unknown for missing IP", () => {
      const request = new Request("https://example.com")
      const key = getRateLimitKey(request, "test")
      expect(key).toBe("test:unknown")
    })
  })

  describe("RATE_LIMITS config", () => {
    it("should have stricter limits for auth", () => {
      expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.api.limit)
    })

    it("should have stricter limits for AI operations", () => {
      expect(RATE_LIMITS.aiAnalysis.limit).toBeLessThan(RATE_LIMITS.api.limit)
    })
  })
})
