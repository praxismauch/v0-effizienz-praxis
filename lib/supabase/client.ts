"use client"

// Singleton promise to prevent race conditions during client creation
let clientPromise: Promise<SupabaseClient | null> | null = null

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

// Module-level singleton - survives hot reloads
let cachedClient: SupabaseClient | null = null

let isCreating = false // Declare the variable before using it

function createClientSafe(): SupabaseClient | null {
  // Double-check we're not creating duplicate clients
  if (cachedClient) return cachedClient
  if (typeof window !== "undefined" && window.__supabaseClient) return window.__supabaseClient

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
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          // Silently fail - storage might be full or unavailable
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          // Silently fail
        }
      },
    }

    // Custom fetch that handles network errors gracefully
    const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(url, {
          ...options,
          signal: options?.signal || controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        // Return a mock error response for network failures instead of throwing
        if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("Failed") || errorMessage.includes("aborted")) {
          return new Response(JSON.stringify({ 
            error: "network_error", 
            error_description: "Network request failed - please check your connection" 
          }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        }
        throw error
      }
    }

    const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: storageKey,
        persistSession: true,
        detectSessionInUrl: false, // Disable to prevent multiple auth checks
        flowType: "pkce",
        autoRefreshToken: false, // Disable to prevent background fetch errors
        debug: false,
        storage: customStorage,
      },
      global: {
        headers: {
          "x-client-info": "effizienz-praxis-client",
        },
        fetch: customFetch,
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

  // Return existing singleton immediately
  if (window.__supabaseClient) {
    return window.__supabaseClient
  }

  // Check module-level cache (survives component re-renders)
  if (cachedClient) {
    window.__supabaseClient = cachedClient
    return cachedClient
  }

  // Prevent concurrent creation
  if (window.__supabaseClientCreating) {
    // Return null and let caller retry - this prevents duplicate clients
    return null
  }

  window.__supabaseClientCreating = true

  try {
    const client = createClientSafe()

    if (client) {
      cachedClient = client
      window.__supabaseClient = client
    }

    return client
  } finally {
    window.__supabaseClientCreating = false
  }
}

export async function getClientAsync(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return null
  
  // Return existing client immediately
  if (window.__supabaseClient) return window.__supabaseClient
  if (cachedClient) {
    window.__supabaseClient = cachedClient
    return cachedClient
  }
  
  // Use promise to prevent multiple concurrent creations
  if (clientPromise) {
    return clientPromise
  }
  
  clientPromise = new Promise((resolve) => {
    const client = createClient()
    resolve(client)
  })
  
  return clientPromise
}

export function getClientSafe(): SupabaseClient | null {
  return createClient()
}

// Alias for compatibility with code expecting createBrowserClient
export const createBrowserClient = createClient

export default createClient
