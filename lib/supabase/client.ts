"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
    __btoaPatched?: boolean
  }
}

// Patch btoa/atob for Unicode support
if (typeof window !== "undefined" && !window.__btoaPatched) {
  const _btoa = window.btoa
  const _atob = window.atob

  window.btoa = (str: string): string => {
    try {
      if (str == null || str === "") return _btoa.call(window, "")
      str = String(str)
      let isAscii = true
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
          isAscii = false
          break
        }
      }
      if (isAscii) return _btoa.call(window, str)
      if (typeof TextEncoder !== "undefined") {
        const bytes = new TextEncoder().encode(str)
        let binaryString = ""
        for (let j = 0; j < bytes.length; j++) {
          binaryString += String.fromCharCode(bytes[j])
        }
        return _btoa.call(window, binaryString)
      }
      return _btoa.call(window, str.replace(/[^\x00-\x7F]/g, "?"))
    } catch {
      return _btoa.call(window, "")
    }
  }

  window.atob = (str: string): string => {
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
    } catch {
      return ""
    }
  }

  window.__btoaPatched = true
}

// STRICT SINGLETON - The client is created ONLY ONCE and stored globally
// This prevents the "Multiple GoTrueClient instances" warning
function getOrCreateClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null
  }

  // Return existing singleton immediately - this is the key to preventing duplicates
  if (window.__supabaseClient) {
    return window.__supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "default"
  const storageKey = `sb-${projectRef}-auth-token`

  // Custom storage that silently handles errors
  const customStorage = {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value)
      } catch {
        // Silently fail
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Silently fail
      }
    },
  }

  // Custom fetch that handles network errors gracefully
  const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    try {
      const response = await fetch(url, options)
      return response
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      // Return a mock error response for network failures instead of throwing
      if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("Failed")) {
        return new Response(JSON.stringify({ 
          error: "network_error", 
          error_description: "Network request failed" 
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw error
    }
  }

  try {
    // Suppress ALL unhandled promise rejections for auth fetch errors in v0 preview
    // This MUST be set up BEFORE creating the client
    if (typeof window !== "undefined") {
      // Set up global error suppression for Supabase auth errors
      if (!(window as Window & { __supabaseErrorHandlerSet?: boolean }).__supabaseErrorHandlerSet) {
        // Suppress unhandled promise rejections
        window.addEventListener("unhandledrejection", (event) => {
          const message = event.reason?.message || event.reason?.toString?.() || String(event.reason || "")
          if (
            message.includes("Failed to fetch") || 
            message.includes("_getUser") || 
            message.includes("_useSession") ||
            message.includes("NetworkError") ||
            message.includes("TypeError")
          ) {
            event.preventDefault()
            event.stopPropagation()
            return false
          }
        }, true) // Use capture phase to catch early
        
        // Also suppress regular errors
        const originalOnError = window.onerror
        window.onerror = function(message, source, lineno, colno, error) {
          const msg = String(message || "")
          if (
            msg.includes("Failed to fetch") || 
            msg.includes("_getUser") || 
            msg.includes("_useSession") ||
            msg.includes("NetworkError")
          ) {
            return true // Suppress error
          }
          if (originalOnError) {
            return originalOnError.call(window, message, source, lineno, colno, error)
          }
          return false
        }
        
        ;(window as Window & { __supabaseErrorHandlerSet?: boolean }).__supabaseErrorHandlerSet = true
      }
    }

    const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: storageKey,
        persistSession: true,
        detectSessionInUrl: false,
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

    // Store globally to ensure true singleton
    window.__supabaseClient = client
    return client
  } catch {
    return null
  }
}

// Main export - always returns the same singleton instance
export function createClient(): SupabaseClient | null {
  return getOrCreateClient()
}

export function getClientSafe(): SupabaseClient | null {
  return getOrCreateClient()
}

export const createBrowserClient = createClient

export default createClient
