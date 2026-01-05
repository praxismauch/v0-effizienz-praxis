/**
 * Unit tests for API response helpers
 * Run with: npx jest lib/api/__tests__/responses.test.ts
 */
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  apiPaginatedSuccess,
  HTTP_STATUS,
  ERROR_CODES,
} from "../responses"

describe("API Response Helpers", () => {
  describe("apiSuccess", () => {
    it("should return 200 status with data", async () => {
      const response = apiSuccess({ message: "Hello" })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ message: "Hello" })
    })

    it("should allow custom status code", async () => {
      const response = apiSuccess({ id: "123" }, HTTP_STATUS.CREATED)
      expect(response.status).toBe(201)
    })

    it("should set cache headers when specified", async () => {
      const response = apiSuccess({ data: "test" }, 200, {
        cache: { maxAge: 60, staleWhileRevalidate: 120 },
      })
      expect(response.headers.get("Cache-Control")).toBe("public, max-age=60, stale-while-revalidate=120")
    })
  })

  describe("apiPaginatedSuccess", () => {
    it("should return paginated response structure", async () => {
      const items = [{ id: 1 }, { id: 2 }]
      const response = apiPaginatedSuccess(items, { page: 1, limit: 10, total: 25 })
      const data = await response.json()

      expect(data.data).toEqual(items)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasMore: true,
      })
    })

    it("should calculate hasMore correctly on last page", async () => {
      const response = apiPaginatedSuccess([], { page: 3, limit: 10, total: 25 })
      const data = await response.json()
      expect(data.pagination.hasMore).toBe(false)
    })
  })

  describe("apiError", () => {
    it("should return error response with code and message", async () => {
      const response = apiError("Something went wrong", 500, { code: ERROR_CODES.INTERNAL_ERROR })
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe(true)
      expect(data.code).toBe("INTERNAL_ERROR")
      expect(data.message).toBe("Something went wrong")
      expect(data.timestamp).toBeDefined()
    })

    it("should include details when provided", async () => {
      const response = apiError("Error", 400, { details: { field: "email" } })
      const data = await response.json()
      expect(data.details).toEqual({ field: "email" })
    })
  })

  describe("apiBadRequest", () => {
    it("should return 400 with VALIDATION_ERROR code", async () => {
      const response = apiBadRequest("Invalid input")
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.code).toBe("VALIDATION_ERROR")
    })
  })

  describe("apiUnauthorized", () => {
    it("should return 401 with default German message", async () => {
      const response = apiUnauthorized()
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.message).toBe("Authentifizierung erforderlich")
      expect(data.code).toBe("AUTH_REQUIRED")
    })
  })

  describe("apiForbidden", () => {
    it("should return 403 with AUTH_FORBIDDEN code", async () => {
      const response = apiForbidden()
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.code).toBe("AUTH_FORBIDDEN")
    })
  })

  describe("apiNotFound", () => {
    it("should return 404 with resource name in message", async () => {
      const response = apiNotFound("Benutzer")
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.message).toBe("Benutzer nicht gefunden")
    })
  })

  describe("apiValidationError", () => {
    it("should handle string errors", async () => {
      const response = apiValidationError("Email ist ungültig")
      const data = await response.json()
      expect(data.message).toBe("Email ist ungültig")
    })

    it("should handle array of errors", async () => {
      const response = apiValidationError(["Error 1", "Error 2"])
      const data = await response.json()
      expect(data.message).toBe("Error 1, Error 2")
    })

    it("should handle object errors with field mapping", async () => {
      const response = apiValidationError({ email: "ungültig", password: "zu kurz" })
      const data = await response.json()
      expect(data.message).toContain("email: ungültig")
      expect(data.message).toContain("password: zu kurz")
    })
  })

  describe("apiRateLimited", () => {
    it("should return 429 with Retry-After header", async () => {
      const response = apiRateLimited(60)
      expect(response.status).toBe(429)
      expect(response.headers.get("Retry-After")).toBe("60")
      const data = await response.json()
      expect(data.code).toBe("RATE_LIMITED")
    })
  })
})
