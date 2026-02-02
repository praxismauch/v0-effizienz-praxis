import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
      console.error("Error fetching sidebar preferences:", error)
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
    console.error("Error in sidebar preferences GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  let body;
  try {
    body = await request.json()
  } catch (bodyError) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

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

    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites, single_group_mode } = body

    const effectivePracticeId = String(practice_id || "1")

    const adminClient = await createAdminClient()
    
    // If Supabase isn't configured, return success (localStorage is handling the data)
    if (!adminClient) {
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

    // Build update object with only defined values - exclude potentially missing columns
    const updateData: Record<string, any> = {}
    if (expanded_groups !== undefined) updateData.expanded_groups = expanded_groups
    if (expanded_items !== undefined) updateData.expanded_items = expanded_items
    if (is_collapsed !== undefined) updateData.is_collapsed = is_collapsed
    if (single_group_mode !== undefined) updateData.single_group_mode = single_group_mode

    // Try upsert without favorites first (in case column doesn't exist)
    let upsertError = null
    
    // First try with favorites if it was provided
    if (favorites !== undefined) {
      const { error } = await adminClient
        .from("user_sidebar_preferences")
        .upsert({
          user_id: userId,
          practice_id: effectivePracticeId,
          ...updateData,
          favorites: favorites,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,practice_id"
        })
      
      // If favorites column doesn't exist (PGRST204), try without it
      if (error && error.code === 'PGRST204' && error.message.includes('favorites')) {
        console.log("favorites column not found, saving without it")
        const { error: fallbackError } = await adminClient
          .from("user_sidebar_preferences")
          .upsert({
            user_id: userId,
            practice_id: effectivePracticeId,
            ...updateData,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,practice_id"
          })
        upsertError = fallbackError
      } else {
        upsertError = error
      }
    } else {
      // No favorites to save, just save other preferences
      const { error } = await adminClient
        .from("user_sidebar_preferences")
        .upsert({
          user_id: userId,
          practice_id: effectivePracticeId,
          ...updateData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,practice_id"
        })
      upsertError = error
    }

    if (upsertError) {
      console.error("Error saving sidebar preferences:", upsertError)
      return NextResponse.json({ 
        error: upsertError.message,
        errorCode: upsertError.code,
        errorDetails: upsertError
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
    console.error("Error in sidebar preferences POST:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
