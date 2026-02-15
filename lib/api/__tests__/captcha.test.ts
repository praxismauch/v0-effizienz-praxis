/**
 * Unit tests for progressive CAPTCHA system
 * Run with: npx jest lib/api/__tests__/captcha.test.ts
 */
import {
  checkCaptchaRequirement,
  verifyCaptchaToken,
  validateCaptchaFromRequest,
  recordFailure,
  resetFailures,
  getFailureCount,
} from "../captcha"

// Mock Redis
const mockRedisData = new Map<string, unknown>()
jest.mock("@/lib/redis", () => ({
  getRedis: jest.fn().mockResolvedValue({
    get: jest.fn((key: string) => Promise.resolve(mockRedisData.get(key) || null)),
    set: jest.fn((key: string, value: unknown) => {
      mockRedisData.set(key, value)
      return Promise.resolve("OK")
    }),
    setex: jest.fn((key: string, _ttl: number, value: unknown) => {
      mockRedisData.set(key, value)
      return Promise.resolve("OK")
    }),
    incr: jest.fn((key: string) => {
      const current = Number(mockRedisData.get(key) || 0) + 1
      mockRedisData.set(key, current)
      return Promise.resolve(current)
    }),
    del: jest.fn((key: string) => {
      mockRedisData.delete(key)
      return Promise.resolve(1)
    }),
    expire: jest.fn(() => Promise.resolve(1)),
    zadd: jest.fn(() => Promise.resolve(1)),
  }),
}))

// Mock getClientIp
jest.mock("../rate-limit-redis", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}))

// Mock anomaly-detection
jest.mock("../anomaly-detection", () => ({
  blockIP: jest.fn(),
  logSecurityEvent: jest.fn(),
}))

beforeEach(() => {
  mockRedisData.clear()
})

describe("Progressive CAPTCHA System", () => {
  describe("checkCaptchaRequirement", () => {
    it("should not require CAPTCHA for new IP", async () => {
      const request = new Request("http://localhost/api/test")
      const result = await checkCaptchaRequirement(request)

      expect(result.required).toBe(false)
      expect(result.failureCount).toBe(0)
    })

    it("should not require CAPTCHA below threshold", async () => {
      mockRedisData.set("captcha:failures:127.0.0.1", 3)

      const request = new Request("http://localhost/api/test")
      const result = await checkCaptchaRequirement(request)

      expect(result.required).toBe(false)
      expect(result.failureCount).toBe(3)
    })

    it("should require CAPTCHA at threshold", async () => {
      mockRedisData.set("captcha:failures:127.0.0.1", 4)

      const request = new Request("http://localhost/api/test")
      const result = await checkCaptchaRequirement(request)

      expect(result.required).toBe(true)
      expect(result.failureCount).toBe(4)
    })

    it("should require CAPTCHA above threshold", async () => {
      mockRedisData.set("captcha:failures:127.0.0.1", 8)

      const request = new Request("http://localhost/api/test")
      const result = await checkCaptchaRequirement(request)

      expect(result.required).toBe(true)
      expect(result.failureCount).toBe(8)
    })

    it("should trigger IP block at block threshold", async () => {
      mockRedisData.set("captcha:failures:127.0.0.1", 11)

      const request = new Request("http://localhost/api/test")
      const result = await checkCaptchaRequirement(request)

      expect(result.required).toBe(true)
      expect(result.reason).toContain("blocked")
    })
  })

  describe("verifyCaptchaToken", () => {
    it("should return true when HCAPTCHA_SECRET is not configured", async () => {
      // HCAPTCHA_SECRET_KEY is not set in test environment
      const result = await verifyCaptchaToken("any-token")
      expect(result).toBe(true)
    })
  })

  describe("validateCaptchaFromRequest", () => {
    it("should return invalid when no token is provided", async () => {
      const request = new Request("http://localhost/api/test")
      const result = await validateCaptchaFromRequest(request)

      expect(result.valid).toBe(false)
      expect(result.response).toBeTruthy()
      expect(result.response!.status).toBe(449)
    })

    it("should return valid when token is present and verification succeeds", async () => {
      // Without HCAPTCHA_SECRET, verifyCaptchaToken returns true
      const request = new Request("http://localhost/api/test", {
        headers: { "x-captcha-token": "valid-test-token" },
      })
      const result = await validateCaptchaFromRequest(request)

      expect(result.valid).toBe(true)
      expect(result.response).toBeUndefined()
    })
  })

  describe("recordFailure", () => {
    it("should increment failure count", async () => {
      const request = new Request("http://localhost/api/test")

      await recordFailure(request, "test failure")

      expect(mockRedisData.get("captcha:failures:127.0.0.1")).toBe(1)
    })

    it("should increment on multiple failures", async () => {
      const request = new Request("http://localhost/api/test")

      await recordFailure(request, "test failure 1")
      await recordFailure(request, "test failure 2")
      await recordFailure(request, "test failure 3")

      expect(mockRedisData.get("captcha:failures:127.0.0.1")).toBe(3)
    })
  })

  describe("resetFailures", () => {
    it("should clear failure count", async () => {
      mockRedisData.set("captcha:failures:127.0.0.1", 5)

      const request = new Request("http://localhost/api/test")
      await resetFailures(request)

      expect(mockRedisData.has("captcha:failures:127.0.0.1")).toBe(false)
    })
  })

  describe("getFailureCount", () => {
    it("should return 0 for unknown IP", async () => {
      const count = await getFailureCount("10.0.0.1")
      expect(count).toBe(0)
    })

    it("should return current failure count", async () => {
      mockRedisData.set("captcha:failures:192.168.1.1", 7)
      const count = await getFailureCount("192.168.1.1")
      expect(count).toBe(7)
    })
  })
})
