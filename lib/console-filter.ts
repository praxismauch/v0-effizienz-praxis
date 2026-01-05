// Filter out Supabase GoTrueClient warnings
if (typeof window !== "undefined") {
  const originalWarn = console.warn
  const originalInfo = console.info

  console.warn = (...args: any[]) => {
    const message = args.join(" ")
    // Filter out GoTrueClient multiple instances warnings
    if (message.includes("Multiple GoTrueClient instances") || message.includes("GoTrueClient")) {
      return
    }
    originalWarn.apply(console, args)
  }

  console.info = (...args: any[]) => {
    const message = args.join(" ")
    // Filter out GoTrueClient info messages
    if (message.includes("Multiple GoTrueClient instances") || message.includes("GoTrueClient")) {
      return
    }
    originalInfo.apply(console, args)
  }
}
