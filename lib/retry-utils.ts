/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: any) => void
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 8000, backoffFactor = 2, onRetry } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts) {
        throw error
      }

      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay)

      if (onRetry) {
        onRetry(attempt, error)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export function isAuthError(error: any): boolean {
  return (
    error?.status === 401 ||
    error?.statusCode === 401 ||
    error?.message?.includes("Unauthorized") ||
    error?.message?.includes("session")
  )
}
