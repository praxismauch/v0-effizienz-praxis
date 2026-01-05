export interface TestResult {
  id: string
  name: string
  status: "passed" | "failed" | "skipped"
  duration: number
  error?: string
  details?: string
  category: string
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  duration: number
}

// Test runner utility
export async function runTest(name: string, category: string, testFn: () => Promise<void> | void): Promise<TestResult> {
  const startTime = Date.now()
  const id = `${category}-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

  try {
    await testFn()
    return {
      id,
      name,
      status: "passed",
      duration: Date.now() - startTime,
      category,
    }
  } catch (error) {
    return {
      id,
      name,
      status: "failed",
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
      category,
    }
  }
}

// Assert utilities
export function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`)
  }
}

export function assertNotNull(value: any, message?: string) {
  if (value === null || value === undefined) {
    throw new Error(message || "Expected value to be non-null")
  }
}

export function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Expected condition to be true")
  }
}

export function assertFalse(condition: boolean, message?: string) {
  if (condition) {
    throw new Error(message || "Expected condition to be false")
  }
}

export function assertThrows(fn: () => void, message?: string) {
  try {
    fn()
    throw new Error(message || "Expected function to throw an error")
  } catch (error) {
    // Expected
  }
}

// Mock data generators
export function generateMockPractice() {
  return {
    id: `test-practice-${Date.now()}`,
    name: "Test Praxis",
    address: "Teststraße 1",
    city: "Berlin",
    postal_code: "10115",
    phone: "+49 30 12345678",
    email: "test@praxis.de",
    created_at: new Date().toISOString(),
  }
}

export function generateMockUser() {
  return {
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    full_name: "Test User",
    role: "admin",
    practice_id: null,
    created_at: new Date().toISOString(),
  }
}

export function generateMockWorkflow() {
  return {
    id: `test-workflow-${Date.now()}`,
    practice_id: "test-practice",
    name: "Test Workflow",
    description: "Test workflow description",
    category_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
  }
}
