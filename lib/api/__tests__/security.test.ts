/**
 * Unit tests for security middleware
 * Run with: npx jest lib/api/__tests__/security.test.ts
 */
import { NextRequest } from "next/server"
import { applySecurityChecks, withSecurity } from "../security"
import { z } from "zod"
import jest from "jest"

// Mock the rate limiting modules
jest.mock("../rate-limit-redis", () => ({
  isRateLimitingEnabled: () => false,
  applyRateLimitRedis: jest.fn(),
}))

describe("Security Middleware", () => {
  describe("applySecurityChecks", () => {
    it("should pass with valid request and no options", async () => {
      const request = new NextRequest("http://localhost/api/test")
      const result = await applySecurityChecks(request, { rateLimit: false })

      expect(result.success).toBe(true)
    })

    it("should validate body schema", async () => {
      const bodySchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })

      const request = new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test", email: "test@example.com" }),
        headers: { "Content-Type": "application/json" },
      })

      const result = await applySecurityChecks(request, {
        bodySchema,
        rateLimit: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.body).toEqual({ name: "Test", email: "test@example.com" })
      }
    })

    it("should reject invalid body", async () => {
      const bodySchema = z.object({
        email: z.string().email(),
      })

      const request = new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: JSON.stringify({ email: "invalid-email" }),
        headers: { "Content-Type": "application/json" },
      })

      const result = await applySecurityChecks(request, {
        bodySchema,
        rateLimit: false,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(400)
      }
    })

    it("should reject invalid JSON", async () => {
      const bodySchema = z.object({ name: z.string() })

      const request = new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      })

      const result = await applySecurityChecks(request, {
        bodySchema,
        rateLimit: false,
      })

      expect(result.success).toBe(false)
    })

    it("should validate query parameters", async () => {
      const querySchema = z.object({
        page: z.coerce.number().min(1),
        limit: z.coerce.number().max(100),
      })

      const request = new NextRequest("http://localhost/api/test?page=2&limit=50")

      const result = await applySecurityChecks(request, {
        querySchema,
        rateLimit: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.query).toEqual({ page: 2, limit: 50 })
      }
    })

    it("should reject invalid query parameters", async () => {
      const querySchema = z.object({
        limit: z.coerce.number().max(100),
      })

      const request = new NextRequest("http://localhost/api/test?limit=500")

      const result = await applySecurityChecks(request, {
        querySchema,
        rateLimit: false,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("withSecurity wrapper", () => {
    it("should call handler with validated data", async () => {
      const bodySchema = z.object({ message: z.string() })

      const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))

      const wrappedHandler = withSecurity({ bodySchema, rateLimit: false }, handler)

      const request = new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: JSON.stringify({ message: "Hello" }),
        headers: { "Content-Type": "application/json" },
      })

      await wrappedHandler(request)

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          body: { message: "Hello" },
        }),
      )
    })

    it("should return error response without calling handler on validation failure", async () => {
      const bodySchema = z.object({ required: z.string() })

      const handler = jest.fn()

      const wrappedHandler = withSecurity({ bodySchema, rateLimit: false }, handler)

      const request = new NextRequest("http://localhost/api/test", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      })

      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
    })
  })
})
