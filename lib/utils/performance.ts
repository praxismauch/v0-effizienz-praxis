export function measurePerformance(label: string) {
  if (typeof window === "undefined") return

  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
      }
    },
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastRan = 0

  return ((...args: any[]) => {
    const now = Date.now()

    if (now - lastRan >= delay) {
      func(...args)
      lastRan = now
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(
        () => {
          func(...args)
          lastRan = Date.now()
        },
        delay - (now - lastRan),
      )
    }
  }) as T
}
