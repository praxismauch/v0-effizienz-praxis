// CRITICAL: This file MUST be imported before ANY Supabase code
// It patches window.btoa and window.atob to handle Unicode characters safely

let isChecked = false

export function ensureBtoaPatched(): void {
  if (typeof window === "undefined") return
  if (isChecked) return

  isChecked = true

  // Check if the global polyfill was loaded
  if (window.__btoaPatched === true) {
    console.log("[v0] btoa polyfill already loaded from global script")
    return
  }

  // If not patched yet, log warning (should not happen)
  console.warn("[v0] btoa polyfill not found - global script may not have loaded yet")

  // Emergency fallback: Patch it now
  emergencyPatch()
}

function emergencyPatch(): void {
  // Store original functions
  const originalBtoa = window.btoa
  const originalAtob = window.atob

  // BTOA: String to Base64 (with Unicode support)
  window.btoa = function safeBtoa(str: string): string {
    try {
      if (str == null) return originalBtoa("")
      str = String(str)
      if (str === "") return originalBtoa("")

      // Check if ASCII-only (fast path)
      let isAscii = true
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
          isAscii = false
          break
        }
      }

      if (isAscii) return originalBtoa(str)

      // Handle Unicode with TextEncoder
      try {
        const bytes = new TextEncoder().encode(str)
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
        return originalBtoa(binString)
      } catch (encodeError) {
        console.error("[v0-emergency] btoa encoding failed, stripping non-ASCII", encodeError)
        const asciiOnly = str.replace(/[^\x00-\x7F]/g, "")
        return originalBtoa(asciiOnly || "")
      }
    } catch (error) {
      console.error("[v0-emergency] btoa fatal error:", error)
      return originalBtoa("")
    }
  }

  // ATOB: Base64 to String (with Unicode support)
  window.atob = function safeAtob(str: string): string {
    try {
      if (str == null) return originalAtob("")
      str = String(str)
      if (str === "") return originalAtob("")

      const decoded = originalAtob(str)

      try {
        const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0))
        return new TextDecoder().decode(bytes)
      } catch {
        return decoded
      }
    } catch (error) {
      console.error("[v0-emergency] atob error:", error)
      return originalAtob("")
    }
  }

  window.__btoaPatched = true
  console.log("[v0] Emergency btoa polyfill applied")
}

// Auto-execute immediately when this module loads
if (typeof window !== "undefined") {
  ensureBtoaPatched()
}
