import { createAdminClient } from "@/lib/supabase/admin"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - Get a single run with all its results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params

    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const { data: run, error: runError } = await adminClient
      .from("screenshot_runs")
      .select("*")
      .eq("id", runId)
      .single()

    if (runError || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }

    const { data: results, error: resultsError } = await adminClient
      .from("screenshot_results")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true })

    if (resultsError) {
      console.error("Error fetching screenshot results:", resultsError)
    }

    return NextResponse.json({ run, results: results || [] })
  } catch (error) {
    console.error("Error in screenshot run GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update a run (status, counts) and its individual results
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params

    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const body = await request.json()

    // Update individual result
    if (body.resultId) {
      const updateData: Record<string, unknown> = { status: body.status }
      if (body.imageUrl) updateData.image_url = body.imageUrl
      if (body.error) updateData.error_message = body.error
      if (body.status === "completed" || body.status === "failed") {
        updateData.captured_at = new Date().toISOString()
      }

      await adminClient
        .from("screenshot_results")
        .update(updateData)
        .eq("id", body.resultId)
    }

    // Update run counts and status
    if (body.runUpdate) {
      const runUpdateData: Record<string, unknown> = {}
      if (body.runUpdate.completedCount !== undefined) runUpdateData.completed_count = body.runUpdate.completedCount
      if (body.runUpdate.failedCount !== undefined) runUpdateData.failed_count = body.runUpdate.failedCount
      if (body.runUpdate.status) {
        runUpdateData.status = body.runUpdate.status
        if (body.runUpdate.status === "completed" || body.runUpdate.status === "failed") {
          runUpdateData.finished_at = new Date().toISOString()
        }
      }

      await adminClient
        .from("screenshot_runs")
        .update(runUpdateData)
        .eq("id", runId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in screenshot run PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a run and all its results (cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params

    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const adminClient = await createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const { error } = await adminClient
      .from("screenshot_runs")
      .delete()
      .eq("id", runId)

    if (error) {
      console.error("Error deleting screenshot run:", error)
      return NextResponse.json({ error: "Failed to delete run" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in screenshot run DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
