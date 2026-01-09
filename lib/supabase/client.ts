"use client"

if (typeof window !== "undefined" && !window.__btoaPatched) {
  const _btoa = window.btoa
  const _atob = window.atob

  window.btoa = (str: any): string => {
    try {
      if (str == null || str === "") return _btoa.call(window, "")

      str = String(str)

      // Check if ASCII-only
      let isAscii = true
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
          isAscii = false
          break
        }
      }

      if (isAscii) return _btoa.call(window, str)

      // Handle Unicode with TextEncoder
      if (typeof TextEncoder !== "undefined") {
        const bytes = new TextEncoder().encode(str)
        let binaryString = ""
        for (let j = 0; j < bytes.length; j++) {
          binaryString += String.fromCharCode(bytes[j])
        }
        return _btoa.call(window, binaryString)
      }

      // Fallback: replace non-ASCII
      return _btoa.call(window, str.replace(/[^\x00-\x7F]/g, "?"))
    } catch (error) {
      console.error("[v0-btoa] Error:", error)
      return _btoa.call(window, "")
    }
  }

  window.atob = (str: any): string => {
    try {
      if (str == null || str === "") return _atob.call(window, "")

      str = String(str)
      const decoded = _atob.call(window, str)

      if (typeof TextDecoder !== "undefined") {
        try {
          const bytes = new Uint8Array(decoded.length)
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i)
          }
          return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
        } catch {
          return decoded
        }
      }

      return decoded
    } catch (error) {
      console.error("[v0-atob] Error:", error)
      return ""
    }
  }

  window.__btoaPatched = true
}

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
    __supabaseClientCreating?: boolean
    __btoaPatched?: boolean
  }
}

let cachedClient: SupabaseClient | null = null
let isCreating = false

function createClientSafe(): SupabaseClient | null {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables")
      return null
    }

    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "default"
    const storageKey = `sb-${projectRef}-auth-token`

    const customStorage = {
      getItem: (key: string) => {
        try {
          const item = localStorage.getItem(key)
          return item
        } catch (error) {
          console.error("[v0] Storage getItem error:", error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.error("[v0] Storage setItem error:", error, "Key:", key)
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.error("[v0] Storage removeItem error:", error)
        }
      },
    }

    const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: storageKey,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        autoRefreshToken: true,
        debug: false,
        storage: customStorage,
      },
      global: {
        headers: {
          "x-client-info": "effizienz-praxis-client",
        },
      },
    })

    return client
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return null
  }
}

export function createClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null
  }

  if (window.__supabaseClient) {
    return window.__supabaseClient
  }

  // Check module-level cache
  if (cachedClient) {
    window.__supabaseClient = cachedClient
    return cachedClient
  }

  if (isCreating || window.__supabaseClientCreating) {
    // Wait and retry
    return null
  }

  isCreating = true
  window.__supabaseClientCreating = true

  try {
    const client = createClientSafe()

    if (client) {
      cachedClient = client
      window.__supabaseClient = client
    }

    return client
  } finally {
    isCreating = false
    window.__supabaseClientCreating = false
  }
}

export async function getClientAsync(): Promise<SupabaseClient | null> {
  if (typeof window !== "undefined" && (isCreating || window.__supabaseClientCreating)) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return createClient()
  }
  return createClient()
}

export function getClientSafe(): SupabaseClient | null {
  return createClient()
}

export { createClient as createBrowserClient }
export { createClient as createBrowserSupabaseClient }

export default createClient
