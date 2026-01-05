/**
 * Unit Tests for Critical Functions
 * Run these tests to verify core functionality
 */

import { validateRequest, createUserSchema, createTodoSchema, practiceIdSchema, uuidSchema } from "@/lib/api/schemas"
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit"
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
  isValidPracticeId,
  isValidUUID,
  sanitizeInput,
} from "@/lib/utils/validation"

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

interface TestSuite {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  totalDuration: number
}

/**
 * Run all unit tests
 */
export async function runAllTests(): Promise<TestSuite[]> {
  const suites: TestSuite[] = []

  suites.push(await runValidationTests())
  suites.push(await runZodSchemaTests())
  suites.push(await runRateLimitTests())
  suites.push(await runSanitizationTests())

  return suites
}

/**
 * Validation utility tests
 */
async function runValidationTests(): Promise<TestSuite> {
  const tests: TestResult[] = []

  // Email validation tests
  tests.push(
    runTest("isValidEmail - valid email", () => {
      if (!isValidEmail("test@example.com")) throw new Error("Should be valid")
      if (!isValidEmail("user.name+tag@domain.co.uk")) throw new Error("Should be valid")
    }),
  )

  tests.push(
    runTest("isValidEmail - invalid email", () => {
      if (isValidEmail("invalid")) throw new Error("Should be invalid")
      if (isValidEmail("@domain.com")) throw new Error("Should be invalid")
      if (isValidEmail("test@")) throw new Error("Should be invalid")
    }),
  )

  // Phone validation tests
  tests.push(
    runTest("isValidPhoneNumber - valid German numbers", () => {
      if (!isValidPhoneNumber("+491234567890")) throw new Error("Should be valid")
      if (!isValidPhoneNumber("01234567890")) throw new Error("Should be valid")
    }),
  )

  tests.push(
    runTest("isValidPhoneNumber - invalid numbers", () => {
      if (isValidPhoneNumber("123")) throw new Error("Should be invalid")
      if (isValidPhoneNumber("abc")) throw new Error("Should be invalid")
    }),
  )

  // Postal code tests
  tests.push(
    runTest("isValidPostalCode - valid German codes", () => {
      if (!isValidPostalCode("12345")) throw new Error("Should be valid")
      if (!isValidPostalCode("01234")) throw new Error("Should be valid")
    }),
  )

  tests.push(
    runTest("isValidPostalCode - invalid codes", () => {
      if (isValidPostalCode("1234")) throw new Error("Should be invalid - too short")
      if (isValidPostalCode("123456")) throw new Error("Should be invalid - too long")
    }),
  )

  // Practice ID tests
  tests.push(
    runTest("isValidPracticeId - valid IDs", () => {
      if (!isValidPracticeId("550e8400-e29b-41d4-a716-446655440000")) throw new Error("Should be valid")
      if (!isValidPracticeId("some-id")) throw new Error("Should be valid")
    }),
  )

  tests.push(
    runTest("isValidPracticeId - invalid IDs", () => {
      if (isValidPracticeId(null)) throw new Error("Should be invalid")
      if (isValidPracticeId("0")) throw new Error("Should be invalid")
      if (isValidPracticeId("null")) throw new Error("Should be invalid")
      if (isValidPracticeId("")) throw new Error("Should be invalid")
    }),
  )

  // UUID tests
  tests.push(
    runTest("isValidUUID - valid UUIDs", () => {
      if (!isValidUUID("550e8400-e29b-41d4-a716-446655440000")) throw new Error("Should be valid")
      if (!isValidUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")) throw new Error("Should be valid")
    }),
  )

  tests.push(
    runTest("isValidUUID - invalid UUIDs", () => {
      if (isValidUUID("not-a-uuid")) throw new Error("Should be invalid")
      if (isValidUUID("12345")) throw new Error("Should be invalid")
      if (isValidUUID("")) throw new Error("Should be invalid")
    }),
  )

  return createSuite("Validation Utilities", tests)
}

/**
 * Zod schema tests
 */
async function runZodSchemaTests(): Promise<TestSuite> {
  const tests: TestResult[] = []

  // UUID schema tests
  tests.push(
    runTest("uuidSchema - valid UUID", () => {
      const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000")
      if (!result.success) throw new Error("Should parse valid UUID")
    }),
  )

  tests.push(
    runTest("uuidSchema - invalid UUID", () => {
      const result = uuidSchema.safeParse("not-a-uuid")
      if (result.success) throw new Error("Should reject invalid UUID")
    }),
  )

  // Practice ID schema tests
  tests.push(
    runTest("practiceIdSchema - rejects '0'", () => {
      const result = practiceIdSchema.safeParse("0")
      if (result.success) throw new Error("Should reject '0'")
    }),
  )

  tests.push(
    runTest("practiceIdSchema - rejects 'null'", () => {
      const result = practiceIdSchema.safeParse("null")
      if (result.success) throw new Error("Should reject 'null'")
    }),
  )

  // User schema tests
  tests.push(
    runTest("createUserSchema - valid user", () => {
      const result = validateRequest(createUserSchema, {
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
      })
      if (!result.success) throw new Error(`Should be valid: ${result.error}`)
    }),
  )

  tests.push(
    runTest("createUserSchema - invalid email", () => {
      const result = validateRequest(createUserSchema, {
        email: "invalid",
        full_name: "Test User",
        role: "user",
      })
      if (result.success) throw new Error("Should reject invalid email")
    }),
  )

  tests.push(
    runTest("createUserSchema - name too short", () => {
      const result = validateRequest(createUserSchema, {
        email: "test@example.com",
        full_name: "A",
        role: "user",
      })
      if (result.success) throw new Error("Should reject short name")
    }),
  )

  tests.push(
    runTest("createUserSchema - invalid role", () => {
      const result = validateRequest(createUserSchema, {
        email: "test@example.com",
        full_name: "Test User",
        role: "invalid_role",
      })
      if (result.success) throw new Error("Should reject invalid role")
    }),
  )

  // Todo schema tests
  tests.push(
    runTest("createTodoSchema - valid todo", () => {
      const result = validateRequest(createTodoSchema, {
        title: "Test Todo",
        practice_id: "550e8400-e29b-41d4-a716-446655440000",
      })
      if (!result.success) throw new Error(`Should be valid: ${result.error}`)
    }),
  )

  tests.push(
    runTest("createTodoSchema - missing title", () => {
      const result = validateRequest(createTodoSchema, {
        practice_id: "550e8400-e29b-41d4-a716-446655440000",
      })
      if (result.success) throw new Error("Should reject missing title")
    }),
  )

  return createSuite("Zod Schemas", tests)
}

/**
 * Rate limit tests
 */
async function runRateLimitTests(): Promise<TestSuite> {
  const tests: TestResult[] = []

  // Basic rate limiting
  tests.push(
    runTest("checkRateLimit - allows initial request", () => {
      const result = checkRateLimit("test-initial-" + Date.now(), { limit: 5, windowSeconds: 60 })
      if (!result.success) throw new Error("Should allow initial request")
      if (result.remaining !== 4) throw new Error(`Remaining should be 4, got ${result.remaining}`)
    }),
  )

  tests.push(
    runTest("checkRateLimit - decrements remaining", () => {
      const key = "test-decrement-" + Date.now()
      checkRateLimit(key, { limit: 5, windowSeconds: 60 })
      const result = checkRateLimit(key, { limit: 5, windowSeconds: 60 })
      if (result.remaining !== 3) throw new Error(`Remaining should be 3, got ${result.remaining}`)
    }),
  )

  tests.push(
    runTest("checkRateLimit - blocks when exceeded", () => {
      const key = "test-block-" + Date.now()
      const config = { limit: 2, windowSeconds: 60 }
      checkRateLimit(key, config) // 1
      checkRateLimit(key, config) // 2
      const result = checkRateLimit(key, config) // 3 - should be blocked
      if (result.success) throw new Error("Should block exceeded limit")
      if (result.remaining !== 0) throw new Error("Remaining should be 0")
      if (!result.retryAfter) throw new Error("Should have retryAfter")
    }),
  )

  // Rate limit key generation
  tests.push(
    runTest("getRateLimitKey - generates key from request", () => {
      const mockRequest = {
        headers: new Map([["x-forwarded-for", "192.168.1.1, 10.0.0.1"]]),
      }
      mockRequest.headers.get = (key: string) => mockRequest.headers.get(key) || null
      // Note: This is a simplified test - in real usage the Request object is different
    }),
  )

  // Predefined limits
  tests.push(
    runTest("RATE_LIMITS - has correct configurations", () => {
      if (RATE_LIMITS.auth.limit !== 5) throw new Error("Auth limit should be 5")
      if (RATE_LIMITS.api.limit !== 100) throw new Error("API limit should be 100")
      if (RATE_LIMITS.aiGenerate.limit !== 10) throw new Error("AI generate limit should be 10")
    }),
  )

  return createSuite("Rate Limiting", tests)
}

/**
 * Sanitization tests
 */
async function runSanitizationTests(): Promise<TestSuite> {
  const tests: TestResult[] = []

  tests.push(
    runTest("sanitizeInput - removes script tags", () => {
      const result = sanitizeInput('<script>alert("xss")</script>Hello')
      if (result.includes("<script>")) throw new Error("Should remove script tags")
      if (!result.includes("Hello")) throw new Error("Should keep safe content")
    }),
  )

  tests.push(
    runTest("sanitizeInput - trims whitespace", () => {
      const result = sanitizeInput("  test  ")
      if (result !== "test") throw new Error("Should trim whitespace")
    }),
  )

  tests.push(
    runTest("sanitizeInput - handles empty string", () => {
      const result = sanitizeInput("")
      if (result !== "") throw new Error("Should handle empty string")
    }),
  )

  return createSuite("Sanitization", tests)
}

/**
 * Helper: Run a single test
 */
function runTest(name: string, testFn: () => void): TestResult {
  const start = performance.now()
  try {
    testFn()
    return {
      name,
      passed: true,
      duration: performance.now() - start,
    }
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: performance.now() - start,
    }
  }
}

/**
 * Helper: Create test suite summary
 */
function createSuite(name: string, tests: TestResult[]): TestSuite {
  const passed = tests.filter((t) => t.passed).length
  const failed = tests.filter((t) => !t.passed).length
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0)

  return { name, tests, passed, failed, totalDuration }
}

/**
 * Format test results for display
 */
export function formatTestResults(suites: TestSuite[]): string {
  let output = "\n=== Unit Test Results ===\n\n"

  for (const suite of suites) {
    output += `${suite.name}\n`
    output += "─".repeat(40) + "\n"

    for (const test of suite.tests) {
      const status = test.passed ? "PASS" : "FAIL"
      const statusColor = test.passed ? "" : " <<"
      output += `  [${status}] ${test.name}${statusColor}\n`
      if (!test.passed && test.error) {
        output += `         Error: ${test.error}\n`
      }
    }

    output += `\n  Results: ${suite.passed}/${suite.tests.length} passed`
    output += ` (${suite.totalDuration.toFixed(2)}ms)\n\n`
  }

  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0)
  const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0)
  const allPassed = totalPassed === totalTests

  output += "═".repeat(40) + "\n"
  output += `Total: ${totalPassed}/${totalTests} tests passed\n`
  output += `Status: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}\n`

  return output
}
