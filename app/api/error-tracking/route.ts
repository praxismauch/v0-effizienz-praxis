import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

function generateFingerprint(error: any): string {
  const parts = [
    error.category || "",
    error.error_name || "",
    error.message?.substring(0, 100) || "",
    error.url?.split("?")[0] || ""
  ]
  return crypto.createHash("md5").update(parts.join("|")).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { errors } = body
    
    if (!errors || !Array.isArray(errors)) {
      // Single error format
      const singleError = body
      const supabase = getSupabaseAdmin()
      
      const fingerprint = generateFingerprint(singleError)
      
      const logEntry = {
        level: singleError.level || "error",
        category: singleError.category || "other",
        message: singleError.message || "Unknown error",
        error_name: singleError.error?.name || singleError.errorName,
        error_message: singleError.error?.message || singleError.errorMessage,
        stack_trace: singleError.error?.stack || singleError.stackTrace,
        source: typeof window === "undefined" ? "server" : "client",
        url: singleError.url,
        method: singleError.method,
        user_agent: request.headers.get("user-agent") || undefined,
        ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || 
                    request.headers.get("x-real-ip") || undefined,
        user_id: singleError.userId,
        practice_id: singleError.practiceId ? parseInt(singleError.practiceId) : null,
        request_id: singleError.requestId,
        metadata: singleError.context || singleError.details || {},
        fingerprint,
        status: "new"
      }
      
      const { error } = await supabase.from("error_logs").insert(logEntry)
      
      if (error) {
        console.error("[v0] Error inserting log:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    // Batch errors format
    const supabase = getSupabaseAdmin()
    
    const logEntries = errors.map((err: any) => ({
      level: err.level || "error",
      category: err.category || "other",
      message: err.message || "Unknown error",
      error_name: err.error?.name,
      error_message: err.error?.message,
      stack_trace: err.error?.stack,
      source: "client",
      url: err.url,
      user_agent: err.userAgent,
      metadata: err.context || {},
      fingerprint: generateFingerprint(err),
      status: "new",
      created_at: err.timestamp || new Date().toISOString()
    }))
    
    const { error } = await supabase.from("error_logs").insert(logEntries)
    
    if (error) {
      console.error("[v0] Error inserting batch logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, count: logEntries.length })
  } catch (error: any) {
    console.error("[v0] Error in error-tracking API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
