import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { delay, isRateLimitError } from "@/lib/supabase/safe-query"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Cache for 1 hour

/**
 * GET /api/tickets/config
 * Returns all ticket configuration (statuses, priorities, types)
 * Used by ticket UI components to populate dropdowns and filters
 */
export async function GET(request: Request) {
  try {
    console.log("[v0] GET /api/tickets/config - Fetching ticket configuration")

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const configType = searchParams.get("type") // 'statuses', 'priorities', 'types', or null for all

    const statusesResult = await supabase
      .from("ticket_statuses")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    // Small delay between queries
    await delay(50)

    const prioritiesResult = await supabase
      .from("ticket_priorities")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    await delay(50)

    const typesResult = await supabase
      .from("ticket_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (
      isRateLimitError(statusesResult.error) ||
      isRateLimitError(prioritiesResult.error) ||
      isRateLimitError(typesResult.error)
    ) {
      console.warn("[v0] Rate limited fetching ticket config, returning empty fallback")
      return NextResponse.json(
        {
          statuses: [],
          priorities: [],
          types: [],
          _metadata: {
            cached_until: new Date(Date.now() + 60 * 1000).toISOString(),
            version: "1.0.0",
            rate_limited: true,
          },
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        },
      )
    }

    // Check for errors
    if (statusesResult.error) {
      console.error("[v0] Error fetching ticket statuses:", statusesResult.error)
      return NextResponse.json(
        { error: "Failed to fetch ticket statuses", details: statusesResult.error.message },
        { status: 500 },
      )
    }

    if (prioritiesResult.error) {
      console.error("[v0] Error fetching ticket priorities:", prioritiesResult.error)
      return NextResponse.json(
        { error: "Failed to fetch ticket priorities", details: prioritiesResult.error.message },
        { status: 500 },
      )
    }

    if (typesResult.error) {
      console.error("[v0] Error fetching ticket types:", typesResult.error)
      return NextResponse.json(
        { error: "Failed to fetch ticket types", details: typesResult.error.message },
        { status: 500 },
      )
    }

    const statuses = statusesResult.data || []
    const priorities = prioritiesResult.data || []
    const types = typesResult.data || []

    console.log("[v0] Ticket config fetched:", {
      statusesCount: statuses.length,
      prioritiesCount: priorities.length,
      typesCount: types.length,
    })

    // Return specific type or all configurations
    if (configType === "statuses") {
      return NextResponse.json({ statuses })
    } else if (configType === "priorities") {
      return NextResponse.json({ priorities })
    } else if (configType === "types") {
      return NextResponse.json({ types })
    }

    // Return all configurations
    const config = {
      statuses,
      priorities,
      types,
      _metadata: {
        cached_until: new Date(Date.now() + 3600 * 1000).toISOString(),
        version: "1.0.0",
      },
    }

    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("[v0] Error in tickets config GET:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch ticket configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
