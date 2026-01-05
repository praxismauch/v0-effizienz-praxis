"use client"

// Suppress Supabase GoTrueClient multiple instance warnings
if (typeof window !== "undefined") {
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    // Filter out GoTrueClient multiple instance warnings
    const message = args[0]
    if (
      typeof message === "string" &&
      (message.includes("Multiple GoTrueClient instances") || message.includes("GoTrueClient@"))
    ) {
      return // Suppress this warning
    }
    // Pass through all other warnings
    originalWarn.apply(console, args)
  }
}

export {}
