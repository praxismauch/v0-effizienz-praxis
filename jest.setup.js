/**
 * Jest setup file
 * Runs before each test file
 */

// Import Jest
const jest = require("jest")

// Mock Next.js server components
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => new Map()),
}))

// Import beforeEach
const { beforeEach } = require("@jest/globals")

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Global test timeout
jest.setTimeout(10000)
