import { createAdminClient } from "@/lib/supabase/admin"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - List all runs (latest first)
export async function GET(request: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ runs: [] })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ runs: [] })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")

    const { data: runs, error } = await adminClient
      .from("screenshot_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching screenshot runs:", error)
      return NextResponse.json({ runs: [] })
    }

    return NextResponse.json({ runs: runs || [] })
  } catch (error) {
    console.error("Error in screenshot runs GET:", error)
    return NextResponse.json({ runs: [] })
  }
}

// POST - Create a new run
export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const { pages, viewports, baseUrl } = body

    // Create the run record
    const totalPages = pages.length * viewports.length
    const { data: run, error: runError } = await adminClient
      .from("screenshot_runs")
      .insert({
        status: "running",
        total_pages: totalPages,
        completed_count: 0,
        failed_count: 0,
        viewports,
        base_url: baseUrl,
      })
      .select()
      .single()

    if (runError || !run) {
      console.error("Error creating screenshot run:", runError)
      return NextResponse.json({ error: "Failed to create run" }, { status: 500 })
    }

    // Create all result records in pending state
    const results = pages.flatMap((page: { path: string; name: string }) =>
      viewports.map((viewport: string) => ({
        run_id: run.id,
        page_path: page.path,
        page_name: page.name,
        viewport,
        status: "pending",
      }))
    )

    const { error: resultsError } = await adminClient
      .from("screenshot_results")
      .insert(results)

    if (resultsError) {
      console.error("Error creating screenshot results:", resultsError)
      // Still return the run - we can retry creating results
    }

    return NextResponse.json({ run })
  } catch (error) {
    console.error("Error in screenshot runs POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
