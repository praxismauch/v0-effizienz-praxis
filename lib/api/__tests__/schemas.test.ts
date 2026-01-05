/**
 * Unit tests for Zod validation schemas
 * Run with: npx jest lib/api/__tests__/schemas.test.ts
 */
import {
  loginSchema,
  registerSchema,
  practiceIdSchema,
  createTodoSchema,
  createSurveySchema,
  createInventoryItemSchema,
  paginationSchema,
  validateRequest,
} from "../schemas"

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })

    it("should reject short password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "short",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("registerSchema", () => {
    it("should validate complete registration", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1",
        full_name: "Test User",
      })
      expect(result.success).toBe(true)
    })

    it("should require uppercase in password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password1",
        full_name: "Test",
      })
      expect(result.success).toBe(false)
    })

    it("should require number in password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password",
        full_name: "Test",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("practiceIdSchema", () => {
    it("should accept valid UUID", () => {
      const result = practiceIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000")
      expect(result.success).toBe(true)
    })

    it("should reject '0' as practice ID", () => {
      const result = practiceIdSchema.safeParse("0")
      expect(result.success).toBe(false)
    })

    it("should reject 'null' as practice ID", () => {
      const result = practiceIdSchema.safeParse("null")
      expect(result.success).toBe(false)
    })
  })

  describe("createTodoSchema", () => {
    it("should validate todo with required fields", () => {
      const result = createTodoSchema.safeParse({
        title: "Test Todo",
        practice_id: "550e8400-e29b-41d4-a716-446655440000",
      })
      expect(result.success).toBe(true)
    })

    it("should apply default priority", () => {
      const result = createTodoSchema.safeParse({
        title: "Test",
        practice_id: "550e8400-e29b-41d4-a716-446655440000",
      })
      if (result.success) {
        expect(result.data.priority).toBe("medium")
      }
    })

    it("should reject empty title", () => {
      const result = createTodoSchema.safeParse({
        title: "",
        practice_id: "550e8400-e29b-41d4-a716-446655440000",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createSurveySchema", () => {
    it("should validate survey with questions", () => {
      const result = createSurveySchema.safeParse({
        title: "Team Survey",
        type: "team",
        questions: [{ text: "How satisfied are you?", type: "rating", required: true }],
      })
      expect(result.success).toBe(true)
    })

    it("should apply defaults", () => {
      const result = createSurveySchema.safeParse({ title: "Survey" })
      if (result.success) {
        expect(result.data.is_anonymous).toBe(false)
        expect(result.data.type).toBe("custom")
      }
    })
  })

  describe("createInventoryItemSchema", () => {
    it("should validate inventory item", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "Handschuhe",
        category: "medical",
        current_stock: 100,
        minimum_stock: 20,
      })
      expect(result.success).toBe(true)
    })

    it("should reject negative stock", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "Item",
        current_stock: -5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("paginationSchema", () => {
    it("should coerce string numbers", () => {
      const result = paginationSchema.safeParse({
        page: "2",
        limit: "50",
      })
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it("should apply defaults", () => {
      const result = paginationSchema.safeParse({})
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortOrder).toBe("desc")
      }
    })

    it("should reject limit over 100", () => {
      const result = paginationSchema.safeParse({ limit: 200 })
      expect(result.success).toBe(false)
    })
  })

  describe("validateRequest helper", () => {
    it("should return success with data for valid input", () => {
      const result = validateRequest(loginSchema, {
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe("test@example.com")
      }
    })

    it("should return error message for invalid input", () => {
      const result = validateRequest(loginSchema, {
        email: "invalid",
        password: "short",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("email")
      }
    })
  })
})
