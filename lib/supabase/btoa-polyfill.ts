// This file is imported before @supabase/ssr to ensure the patch is applied

if (typeof window !== "undefined" && !window.hasOwnProperty("__btoaSafePatched")) {
  const originalBtoa = window.btoa

  window.btoa = function safeBtoa(str: string): string {
    // Handle null/undefined
    if (str == null) {
      str = ""
    }
    str = String(str)

    // Check if it's safe for native btoa (all chars <= 127)
    let isSafe = true
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 127) {
        isSafe = false
        break
      }
    }

    if (isSafe) {
      try {
        return originalBtoa.call(window, str)
      } catch {
        // Fall through to safe encoding
      }
    }

    // Safe UTF-8 encoding path
    const bytes = new TextEncoder().encode(str)
    let binary = ""
    const len = bytes.length
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return originalBtoa.call(window, binary)
  }

  Object.defineProperty(window, "__btoaSafePatched", {
    value: true,
    writable: false,
    enumerable: false,
  })
}

if (typeof window !== "undefined" && !window.__btoaPatched) {
  console.warn("[v0] btoa-polyfill.ts: Global polyfill not loaded yet. This should not happen. Check app/layout.tsx")
}

export {}
