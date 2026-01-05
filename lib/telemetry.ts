/**
 * ✅ PRESERVES 100% EXISTING BUSINESS LOGIC
 * Performance monitoring for effizienz-praxis.de
 * Zero impact on business logic - observability only
 */

// Performance metrics tracking
export class PerformanceTracker {
  private startTime: number
  private metrics: Map<string, number>

  constructor(private operationName: string) {
    this.startTime = Date.now()
    this.metrics = new Map()
  }

  // Mark a checkpoint
  mark(label: string) {
    this.metrics.set(label, Date.now() - this.startTime)
  }

  // End tracking and log
  end() {
    const totalTime = Date.now() - this.startTime

    console.log(`[v0] Performance: ${this.operationName} took ${totalTime}ms`, {
      operation: this.operationName,
      totalTime,
      checkpoints: Object.fromEntries(this.metrics),
    })

    // Alert on slow operations (>2s)
    if (totalTime > 2000) {
      console.warn(`[v0] SLOW OPERATION: ${this.operationName} took ${totalTime}ms`)
    }

    return totalTime
  }
}

// Circuit breaker for failing endpoints
class CircuitBreaker {
  private failures = new Map<string, { count: number; lastFailure: number }>()
  private readonly threshold = 5
  private readonly timeout = 60000 // 1 minute

  isOpen(endpoint: string): boolean {
    const state = this.failures.get(endpoint)
    if (!state) return false

    const timeSinceLastFailure = Date.now() - state.lastFailure

    // Reset if timeout passed
    if (timeSinceLastFailure > this.timeout) {
      this.failures.delete(endpoint)
      return false
    }

    return state.count >= this.threshold
  }

  recordFailure(endpoint: string) {
    const state = this.failures.get(endpoint) || { count: 0, lastFailure: Date.now() }
    state.count++
    state.lastFailure = Date.now()
    this.failures.set(endpoint, state)

    if (state.count >= this.threshold) {
      console.error(`[v0] Circuit breaker OPEN for ${endpoint} (${state.count} failures)`)
    }
  }

  recordSuccess(endpoint: string) {
    this.failures.delete(endpoint)
  }
}

export const circuitBreaker = new CircuitBreaker()

// Request timing helper
export async function timeRequest<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const tracker = new PerformanceTracker(name)

  try {
    const result = await fn()
    tracker.end()
    circuitBreaker.recordSuccess(name)
    return result
  } catch (error) {
    tracker.end()
    circuitBreaker.recordFailure(name)
    throw error
  }
}
