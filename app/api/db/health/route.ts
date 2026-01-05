import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPoolStats } from "@/lib/db/pool"

export const dynamic = "force-dynamic"

/**
 * Database health check endpoint
 * GET /api/db/health
 *
 * Returns database connection status and pool statistics
 */
export async function GET() {
  const startTime = Date.now()

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase not configured")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Simple connectivity check - query practices table
    const { data, error } = await supabase.from("practices").select("id").limit(1)

    if (error) throw error

    const latency = Date.now() - startTime
    const poolStats = getPoolStats()

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        latency_ms: latency,
        provider: "Supabase",
        server_time: new Date().toISOString(),
      },
      pool: poolStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const latency = Date.now() - startTime

    return NextResponse.json(
      {
        status: "unhealthy",
        database: {
          connected: false,
          latency_ms: latency,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        pool: getPoolStats(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
