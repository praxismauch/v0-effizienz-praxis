import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

console.log("[v0] sidebar-preferences route module loaded at", new Date().toISOString())

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    const adminClient = await createAdminClient()
    
    // If Supabase isn't configured, return defaults (localStorage handles the actual data)
    if (!adminClient) {
      return NextResponse.json({
        preferences: {
          expanded_groups: ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"],
          expanded_items: {},
          is_collapsed: false,
          favorites: [],
          collapsed_sections: [],
        },
      })
    }

    const effectivePracticeId = practiceId || "1"

    // Use select * to avoid schema cache issues with specific columns
    const { data, error } = await adminClient
      .from("user_sidebar_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("practice_id", effectivePracticeId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching sidebar preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduplicate expanded_groups if corrupted
    const rawExpandedGroups = data?.expanded_groups || []
    const expandedGroups = Array.isArray(rawExpandedGroups) 
      ? [...new Set(rawExpandedGroups)] 
      : ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"]

    return NextResponse.json({
      preferences: data
        ? {
            expanded_groups: expandedGroups,
            expanded_items: data.expanded_items || {},
            is_collapsed: data.is_collapsed || false,
            favorites: data.favorites || [],
            collapsed_sections: data.collapsed_sections || [],
            single_group_mode: data.single_group_mode ?? true,
          }
        : {
            expanded_groups: ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"],
            expanded_items: {},
            is_collapsed: false,
            favorites: [],
            collapsed_sections: [],
            single_group_mode: true,
          },
    })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  // IMMEDIATE LOG - if this doesn't appear, the POST handler isn't being called at all
  console.log("[v0] >>>>>>>>>> POST /api/users/[userId]/sidebar-preferences ENTERED <<<<<<<<<<")
  
  // Try reading the body first to see if that's causing issues
  let body;
  try {
    body = await request.json()
    console.log("[v0] Body parsed successfully:", JSON.stringify(body))
  } catch (bodyError) {
    console.error("[v0] Body parse error:", bodyError)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  console.log("[v0] ========= POST HANDLER STARTED =========")
  console.log("[v0] Timestamp:", new Date().toISOString())
  console.log("[v0] Request URL:", request.url)
  try {
    const { userId } = await params
    console.log("[v0] POST - userId from params:", userId)

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] POST - Auth check:", authError ? `Error: ${authError.message}` : `User: ${user?.id}`)

    if (authError || !user) {
      console.log("[v0] POST - Unauthorized: no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      console.log("[v0] POST - Unauthorized: user ID mismatch")
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    // body already parsed above
    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites, single_group_mode } = body
    console.log("[v0] POST - Body received:", { practice_id, favorites_count: favorites?.length, single_group_mode })

    const effectivePracticeId = String(practice_id || "1")

    const adminClient = await createAdminClient()
    
    // If Supabase isn't configured, return success (localStorage is handling the data)
    if (!adminClient) {
      console.log("[v0] Supabase not configured - sidebar preferences handled by localStorage")
      return NextResponse.json({ 
        preferences: { 
          expanded_groups: expanded_groups || [],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          favorites: favorites || [],
          collapsed_sections: []
        } 
      })
    }

    // Use RPC to bypass PostgREST schema cache issues with favorites column
    const { data: rpcResult, error: rpcError } = await adminClient.rpc("upsert_sidebar_preferences", {
      p_user_id: userId,
      p_practice_id: effectivePracticeId,
      p_expanded_groups: expanded_groups !== undefined ? expanded_groups : null,
      p_expanded_items: expanded_items !== undefined ? expanded_items : null,
      p_is_collapsed: is_collapsed !== undefined ? is_collapsed : null,
      p_favorites: favorites !== undefined ? favorites : null,
      p_collapsed_sections: null,
      p_single_group_mode: single_group_mode !== undefined ? single_group_mode : null,
    })

    console.log("[v0] RPC upsert result:", rpcError ? `Error: ${rpcError.message}` : "Success", rpcResult)

    if (rpcError) {
      console.error("[v0] Error saving sidebar preferences:", rpcError)
      return NextResponse.json({ 
        error: rpcError.message,
        errorCode: rpcError.code,
        errorDetails: rpcError
      }, { status: 500 })
    }

    // Fetch the updated preferences to return
    const { data: updatedData } = await adminClient
      .from("user_sidebar_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("practice_id", effectivePracticeId)
      .maybeSingle()

    const responseData = updatedData
      ? {
          ...updatedData,
          is_collapsed: updatedData.is_collapsed || false,
          favorites: updatedData.favorites || [],
          collapsed_sections: updatedData.collapsed_sections || [],
          single_group_mode: updatedData.single_group_mode ?? true,
        }
      : null

    return NextResponse.json({ preferences: responseData })
  } catch (error) {
    console.error("[v0] ========= POST HANDLER ERROR =========")
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error name:", error instanceof Error ? error.name : "unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "no stack")
    console.error("[v0] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2))
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
