export async function register() {
  // Increase EventEmitter max listeners to prevent warnings from
  // multiple parallel Supabase client connections sharing sockets
  if (typeof process !== "undefined" && process.setMaxListeners) {
    process.setMaxListeners(25)
  }

  // Also increase for EventEmitter default
  try {
    const { EventEmitter } = await import("events")
    EventEmitter.defaultMaxListeners = 25
  } catch {
    // Ignore if events module is not available
  }
}
