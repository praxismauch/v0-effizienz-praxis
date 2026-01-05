/**
 * Unit tests for validated handler wrapper
 * Run with: npx jest lib/api/__tests__/with-validation.test.ts
 */
import { NextRequest } from "next/server"
import { z } from "zod"
import { createValidatedHandler } from "../with-validation"
import jest from "jest"

// Mock dependencies
jest.mock("../rate-limit-redis", () => ({
  isRateLimitingEnabled: () => false,
  applyRateLimitRedis: jest.fn(),
}))

jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { practice_id: "test-practice-id" },
          }),
        }),
      }),
    }),
  }),
}))

describe("createValidatedHandler", () => {
  it("should validate body schema and call handler", async () => {
    const bodySchema = z.object({
      title: z.string().min(1),
      priority: z.enum(["low", "medium", "high"]),
    })

    const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ id: "created" }), { status: 201 }))

    const validatedHandler = createValidatedHandler({ bodySchema, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Test Todo", priority: "high" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await validatedHandler(request)

    expect(response.status).toBe(201)
    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        body: { title: "Test Todo", priority: "high" },
      }),
    )
  })

  it("should return 400 for invalid body", async () => {
    const bodySchema = z.object({
      title: z.string().min(5, "Title too short"),
    })

    const handler = jest.fn()

    const validatedHandler = createValidatedHandler({ bodySchema, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ title: "Hi" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await validatedHandler(request)

    expect(response.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error).toBe("Invalid request body")
  })

  it("should validate query parameters", async () => {
    const querySchema = z.object({
      page: z.coerce.number().default(1),
      status: z.enum(["active", "archived"]).optional(),
    })

    const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] })))

    const validatedHandler = createValidatedHandler({ querySchema, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/items?page=2&status=active")

    await validatedHandler(request)

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        query: { page: 2, status: "active" },
      }),
    )
  })

  it("should validate URL params", async () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const handler = jest.fn().mockResolvedValue(new Response("OK"))

    const validatedHandler = createValidatedHandler({ paramsSchema, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/items/123")

    // Simulate Next.js params
    const response = await validatedHandler(request, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    })

    expect(handler).toHaveBeenCalled()
  })

  it("should return 400 for invalid params", async () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const handler = jest.fn()

    const validatedHandler = createValidatedHandler({ paramsSchema, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/items/invalid")

    const response = await validatedHandler(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    })

    expect(response.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  it("should handle auth requirement", async () => {
    const handler = jest.fn().mockResolvedValue(new Response("OK"))

    const validatedHandler = createValidatedHandler({ requireAuth: true, rateLimit: false }, handler)

    const request = new NextRequest("http://localhost/api/protected")

    await validatedHandler(request)

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        userId: "test-user-id",
        practiceId: "test-practice-id",
      }),
    )
  })

  it("should handle invalid JSON gracefully", async () => {
    const bodySchema = z.object({ data: z.string() })

    const validatedHandler = createValidatedHandler({ bodySchema, rateLimit: false }, jest.fn())

    const request = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: "{ invalid json",
      headers: { "Content-Type": "application/json" },
    })

    const response = await validatedHandler(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe("Invalid JSON body")
  })
})
