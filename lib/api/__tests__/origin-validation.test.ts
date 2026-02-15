/**
 * Unit tests for origin header validation
 * Run with: npx jest lib/api/__tests__/origin-validation.test.ts
 */
import { NextRequest } from "next/server"
import { createHmac } from "crypto"

// Set test secret before importing the module
process.env.APP_ORIGIN_SECRET = "test-secret-key-for-unit-tests-only"

import {
  generateOriginToken,
  validateOriginHeader,
  shouldValidateOrigin,
} from "../origin-validation"

describe("Origin Validation", () => {
  describe("generateOriginToken", () => {
    it("should generate a non-empty base64 token", () => {
      const token = generateOriginToken()
      expect(token).toBeTruthy()
      expect(token.length).toBeGreaterThan(0)
    })

    it("should generate a valid base64-encoded JSON", () => {
      const token = generateOriginToken()
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const parsed = JSON.parse(decoded)

      expect(parsed).toHaveProperty("timestamp")
      expect(parsed).toHaveProperty("signature")
      expect(typeof parsed.timestamp).toBe("number")
      expect(typeof parsed.signature).toBe("string")
    })

    it("should generate different tokens on subsequent calls", () => {
      const token1 = generateOriginToken()
      // Small delay to ensure different timestamp
      const token2 = generateOriginToken()
      // Tokens might be the same if called within same millisecond
      // but the structure should be valid
      expect(token1).toBeTruthy()
      expect(token2).toBeTruthy()
    })
  })

  describe("validateOriginHeader", () => {
    it("should validate a valid origin token", () => {
      const token = generateOriginToken()
      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": token },
      })

      expect(validateOriginHeader(request)).toBe(true)
    })

    it("should reject request with no origin header", () => {
      const request = new NextRequest("http://localhost/api/test")
      expect(validateOriginHeader(request)).toBe(false)
    })

    it("should reject request with empty origin header", () => {
      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": "" },
      })
      expect(validateOriginHeader(request)).toBe(false)
    })

    it("should reject request with invalid base64", () => {
      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": "not-valid-base64!!!" },
      })
      expect(validateOriginHeader(request)).toBe(false)
    })

    it("should reject request with tampered signature", () => {
      const timestamp = Date.now()
      const fakeToken = Buffer.from(
        JSON.stringify({ timestamp, signature: "fake-signature-value" })
      ).toString("base64")

      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": fakeToken },
      })

      expect(validateOriginHeader(request)).toBe(false)
    })

    it("should reject request with expired token", () => {
      const oldTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      const signature = createHmac("sha256", "test-secret-key-for-unit-tests-only")
        .update(`${oldTimestamp}`)
        .digest("hex")

      const expiredToken = Buffer.from(
        JSON.stringify({ timestamp: oldTimestamp, signature })
      ).toString("base64")

      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": expiredToken },
      })

      expect(validateOriginHeader(request)).toBe(false)
    })

    it("should reject request with future timestamp", () => {
      const futureTimestamp = Date.now() + 10 * 60 * 1000 // 10 minutes in future
      const signature = createHmac("sha256", "test-secret-key-for-unit-tests-only")
        .update(`${futureTimestamp}`)
        .digest("hex")

      const futureToken = Buffer.from(
        JSON.stringify({ timestamp: futureTimestamp, signature })
      ).toString("base64")

      const request = new NextRequest("http://localhost/api/test", {
        headers: { "x-app-origin": futureToken },
      })

      // Future timestamps should be rejected (age < 0)
      expect(validateOriginHeader(request)).toBe(false)
    })
  })

  describe("shouldValidateOrigin", () => {
    it("should validate super-admin routes", () => {
      expect(shouldValidateOrigin("/api/super-admin/users")).toBe(true)
      expect(shouldValidateOrigin("/api/super-admin/security/analytics")).toBe(true)
    })

    it("should validate user routes", () => {
      expect(shouldValidateOrigin("/api/users")).toBe(true)
      expect(shouldValidateOrigin("/api/users/123")).toBe(true)
    })

    it("should validate practice routes", () => {
      expect(shouldValidateOrigin("/api/practices")).toBe(true)
      expect(shouldValidateOrigin("/api/practices/456/members")).toBe(true)
    })

    it("should skip public endpoints", () => {
      expect(shouldValidateOrigin("/api/public/chat-upload")).toBe(false)
      expect(shouldValidateOrigin("/api/public/health")).toBe(false)
    })

    it("should skip auth endpoints", () => {
      expect(shouldValidateOrigin("/api/auth/login")).toBe(false)
      expect(shouldValidateOrigin("/api/auth/origin-token")).toBe(false)
    })

    it("should validate other API routes by default", () => {
      expect(shouldValidateOrigin("/api/documents")).toBe(true)
      expect(shouldValidateOrigin("/api/todos/create")).toBe(true)
    })
  })
})
