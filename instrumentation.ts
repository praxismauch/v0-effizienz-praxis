export async function register() {
  // Only run Node.js-specific code in the Node.js runtime (not Edge)
  if (typeof globalThis.EdgeRuntime === "undefined") {
    try {
      // Increase EventEmitter max listeners to prevent warnings from
      // multiple parallel Supabase client connections sharing sockets
      if (typeof process !== "undefined" && typeof process.setMaxListeners === "function") {
        process.setMaxListeners(25)
      }

      const { EventEmitter } = await import("events")
      EventEmitter.defaultMaxListeners = 25
    } catch {
      // Ignore if events module is not available (Edge runtime)
    }
  }
}
