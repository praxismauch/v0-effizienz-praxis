import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 500): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const isRetryable =
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") || error.message.includes("fetch failed"))

      if (!isRetryable || i === maxRetries - 1) {
        throw error
      }

      console.log(`[v0] Retry ${i + 1}/${maxRetries} after error:`, error)
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw lastError
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

    console.log("[v0] Updating responsibility:", { practiceId, id })

    if (!practiceId || !id) {
      console.error("[v0] Missing required params:", { practiceId, id })
      return NextResponse.json({ error: "Missing practiceId or id" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client:", clientError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const {
      name,
      description,
      group_name,
      responsible_user_id,
      deputy_user_id,
      team_member_ids,
      suggested_hours_per_week,
      estimated_time_amount,
      estimated_time_period,
      cannot_complete_during_consultation,
      calculate_time_automatically,
      optimization_suggestions,
    } = body

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log("[v0] Updating with data:", { name, responsible_user_id, suggested_hours_per_week })

    const { data, error } = await withRetry(async () => {
      return supabase
        .from("responsibilities")
        .update({
          name: name.trim(),
          description: description || null,
          group_name: group_name || null,
          responsible_user_id: responsible_user_id || null,
          deputy_user_id: deputy_user_id || null,
          team_member_ids: team_member_ids || [],
          suggested_hours_per_week: suggested_hours_per_week ?? null,
          estimated_time_amount: estimated_time_amount ?? null,
          estimated_time_period: estimated_time_period || null,
          cannot_complete_during_consultation: cannot_complete_during_consultation || false,
          calculate_time_automatically: calculate_time_automatically || false,
          optimization_suggestions: optimization_suggestions || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("practice_id", practiceId)
        .select()
        .maybeSingle()
    })

    if (error) {
      console.error("[v0] Supabase error updating responsibility:", error)
      return NextResponse.json({ error: error.message || "Failed to update responsibility" }, { status: 500 })
    }

    if (!data) {
      console.error("[v0] Responsibility not found:", { practiceId, id })
      return NextResponse.json({ error: "Responsibility not found" }, { status: 404 })
    }

    console.log("[v0] Responsibility updated successfully:", data.id)

    const enrichedData = {
      ...data,
      responsible_user_name: null as string | null,
      deputy_user_name: null as string | null,
    }

    const userIds = new Set<string>()
    if (data.responsible_user_id) userIds.add(data.responsible_user_id)
    if (data.deputy_user_id) userIds.add(data.deputy_user_id)

    if (userIds.size > 0) {
      try {
        const { data: teamMembers } = await withRetry(async () => {
          return supabase
            .from("team_members")
            .select(`
              id,
              user_id,
              candidate_id,
              first_name,
              last_name,
              users(first_name, last_name, is_active, role)
            `)
            .in("id", Array.from(userIds))
        })

        if (teamMembers && teamMembers.length > 0) {
          const userMap = new Map(
            teamMembers.map((tm: any) => {
              const userName = tm.users
                ? `${tm.users.first_name} ${tm.users.last_name}`.trim()
                : `${tm.first_name || ""} ${tm.last_name || ""}`.trim()
              return [tm.id, userName]
            }),
          )

          enrichedData.responsible_user_name = userMap.get(data.responsible_user_id) || null
          enrichedData.deputy_user_name = userMap.get(data.deputy_user_id) || null
        }
      } catch (lookupError) {
        console.error("[v0] Error looking up user names:", lookupError)
        // Continue without names rather than failing the whole request
      }
    }

    return NextResponse.json(enrichedData)
  } catch (error) {
    console.error("[v0] Unexpected error updating responsibility:", error)
    const isNetworkError = error instanceof TypeError && error.message.includes("fetch")
    return NextResponse.json(
      {
        error: isNetworkError
          ? "Netzwerkfehler - bitte erneut versuchen"
          : error instanceof Error
            ? error.message
            : "Failed to update responsibility",
      },
      { status: isNetworkError ? 503 : 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("responsibilities")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting responsibility:", error)
      return NextResponse.json({ error: error.message || "Failed to delete responsibility" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting responsibility:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete responsibility" },
      { status: 500 },
    )
  }
}
