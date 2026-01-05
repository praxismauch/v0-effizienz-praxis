"use client"

// Re-export client-side Supabase client ONLY
// For server-side functions, import directly from "@/lib/supabase/server"
// DO NOT import from ./supabase/server here - it would break client components

export {
  createClient,
  createBrowserClient,
  createBrowserSupabaseClient,
  getClientSafe,
  getClientAsync,
} from "./supabase/client"

// NOTE: Server-side exports have been removed to prevent build errors.
// Import server functions directly from "@/lib/supabase/server":
// import { createServerClient, createAdminClient } from "@/lib/supabase/server"
