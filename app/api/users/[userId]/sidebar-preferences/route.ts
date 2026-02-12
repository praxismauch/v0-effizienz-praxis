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

    // For super-admin context, return defaults only (don't query database)
    if (practiceId === "super-admin" || practiceId === "super_admin") {
      return NextResponse.json({
        preferences: {
          expanded_groups: ["overview", "management"],
          expanded_items: [],
          is_collapsed: false,
          favorites: [],
          collapsed_sections: [],
          single_group_mode: true,
        },
        note: "Super-admin preferences use localStorage"
      })
    }

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

    // For super-admin context, don't try to persist to database (practice_id won't exist in practices table)
    if (practice_id === "super-admin" || practice_id === "super_admin") {
      return NextResponse.json({ 
        preferences: { 
          expanded_groups: expanded_groups || [],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          favorites: favorites || [],
          single_group_mode: single_group_mode ?? true,
          collapsed_sections: []
        },
        note: "Super-admin preferences stored in localStorage only"
      })
    }

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

    // Build base update object with only core columns that definitely exist
    const baseUpdateData: Record<string, any> = {
      user_id: userId,
      practice_id: effectivePracticeId,
      updated_at: new Date().toISOString(),
    }
    
    if (expanded_groups !== undefined) baseUpdateData.expanded_groups = expanded_groups
    if (expanded_items !== undefined) baseUpdateData.expanded_items = expanded_items
    if (is_collapsed !== undefined) baseUpdateData.is_collapsed = is_collapsed

    // Try progressive upsert - start with all columns, fall back to fewer columns if they don't exist
    let upsertSuccess = false
    let lastError = null
    
    // Attempt 1: Try with all columns (favorites, single_group_mode)
    if (!upsertSuccess) {
      const fullData = { ...baseUpdateData }
      if (favorites !== undefined) fullData.favorites = favorites
      if (single_group_mode !== undefined) fullData.single_group_mode = single_group_mode
      
      const { error } = await adminClient
        .from("user_sidebar_preferences")
        .upsert(fullData, { onConflict: "user_id,practice_id" })
      
      if (!error) {
        upsertSuccess = true
      } else if (error.code === 'PGRST204') {
        // Column doesn't exist, try with fewer columns
        lastError = error
      } else {
        lastError = error
      }
    }
    
    // Attempt 2: Try without favorites column
    if (!upsertSuccess && lastError?.code === 'PGRST204') {
      const dataWithoutFavorites = { ...baseUpdateData }
      if (single_group_mode !== undefined) dataWithoutFavorites.single_group_mode = single_group_mode
      
      const { error } = await adminClient
        .from("user_sidebar_preferences")
        .upsert(dataWithoutFavorites, { onConflict: "user_id,practice_id" })
      
      if (!error) {
        upsertSuccess = true
      } else if (error.code === 'PGRST204') {
        lastError = error
      } else {
        lastError = error
      }
    }
    
    // Attempt 3: Try with only base columns (most compatible)
    if (!upsertSuccess && lastError?.code === 'PGRST204') {
      const { error } = await adminClient
        .from("user_sidebar_preferences")
        .upsert(baseUpdateData, { onConflict: "user_id,practice_id" })
      
      if (!error) {
        upsertSuccess = true
      } else {
        lastError = error
      }
    }

    if (!upsertSuccess && lastError) {
      // Only log non-schema-cache errors as actual errors
      if (lastError.code !== 'PGRST204') {
        console.error("Error saving sidebar preferences:", lastError)
      }
      // Return success anyway - the client will use localStorage as fallback
      return NextResponse.json({ 
        preferences: {
          expanded_groups: expanded_groups || [],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          favorites: favorites || [],
          single_group_mode: single_group_mode ?? true,
        },
        warning: "Some preferences may not be persisted to database"
      })
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
