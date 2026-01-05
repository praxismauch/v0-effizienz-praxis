/**
 * Request queue to prevent Supabase rate limiting
 * Limits concurrent requests and implements exponential backoff
 */

interface QueuedRequest<T> {
  id: string
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  retries: number
  priority: number
}

class SupabaseRequestQueue {
  private queue: QueuedRequest<any>[] = []
  private activeRequests = 0
  private maxConcurrent = 5 // Max concurrent requests
  private minDelay = 100 // Min delay between requests in ms
  private lastRequestTime = 0
  private rateLimitedUntil = 0

  async enqueue<T>(execute: () => Promise<T>, options: { priority?: number; maxRetries?: number } = {}): Promise<T> {
    const { priority = 5, maxRetries = 3 } = options

    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: Math.random().toString(36).substring(7),
        execute,
        resolve,
        reject,
        retries: maxRetries,
        priority,
      }

      // Insert by priority (lower = higher priority)
      const insertIndex = this.queue.findIndex((r) => r.priority > priority)
      if (insertIndex === -1) {
        this.queue.push(request)
      } else {
        this.queue.splice(insertIndex, 0, request)
      }

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
      return
    }

    // Check if we're rate limited
    const now = Date.now()
    if (now < this.rateLimitedUntil) {
      const waitTime = this.rateLimitedUntil - now
      setTimeout(() => this.processQueue(), waitTime)
      return
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minDelay) {
      setTimeout(() => this.processQueue(), this.minDelay - timeSinceLastRequest)
      return
    }

    const request = this.queue.shift()
    if (!request) return

    this.activeRequests++
    this.lastRequestTime = Date.now()

    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error: any) {
      const isRateLimit = this.isRateLimitError(error)

      if (isRateLimit && request.retries > 0) {
        // Exponential backoff on rate limit
        const backoffMs = Math.min(1000 * Math.pow(2, 3 - request.retries), 10000)
        this.rateLimitedUntil = Date.now() + backoffMs
        request.retries--

        // Re-queue with higher priority
        request.priority = Math.max(0, request.priority - 1)
        this.queue.unshift(request)

        console.warn(`[v0] Rate limited, retrying in ${backoffMs}ms (${request.retries} retries left)`)
      } else {
        request.reject(error)
      }
    } finally {
      this.activeRequests--
      // Process next request with a small delay
      setTimeout(() => this.processQueue(), this.minDelay)
    }
  }

  private isRateLimitError(error: unknown): boolean {
    if (!error) return false
    if (error instanceof SyntaxError) return true

    const errorString = String(error)
    const errorMessage = (error as any)?.message || ""

    return (
      errorString.includes("Too Many") ||
      errorString.includes("Unexpected token") ||
      errorString.includes("is not valid JSON") ||
      errorString.includes("rate limit") ||
      errorString.includes("429") ||
      errorMessage.includes("Too Many") ||
      errorMessage.includes("Unexpected token") ||
      errorMessage.includes("is not valid JSON")
    )
  }

  // Get queue stats for debugging
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      rateLimitedUntil: this.rateLimitedUntil > Date.now() ? new Date(this.rateLimitedUntil).toISOString() : null,
    }
  }
}

// Singleton instance
export const supabaseQueue = new SupabaseRequestQueue()

/**
 * Execute a Supabase query through the rate-limiting queue
 */
export async function queuedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  options?: { priority?: number; maxRetries?: number },
): Promise<{ data: T | null; error: any }> {
  try {
    return await supabaseQueue.enqueue(queryFn, options)
  } catch (error) {
    console.warn("[v0] Queued query failed, returning fallback:", error)
    return { data: fallback, error: { message: "Rate limited", code: "RATE_LIMITED" } }
  }
}
