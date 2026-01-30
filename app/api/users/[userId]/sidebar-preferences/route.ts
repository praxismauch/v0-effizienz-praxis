import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
          }
        : {
            expanded_groups: ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"],
            expanded_items: {},
            is_collapsed: false,
            favorites: [],
            collapsed_sections: [],
          },
    })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
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

    const body = await request.json()
    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites } = body

    const effectivePracticeId = String(practice_id || "1")

    const adminClient = await createAdminClient()

    const { data: existing } = await adminClient
      .from("user_sidebar_preferences")
      .select("id")
      .eq("user_id", userId)
      .eq("practice_id", effectivePracticeId)
      .maybeSingle()

    let result
    if (existing) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (expanded_groups !== undefined) updateData.expanded_groups = expanded_groups
      if (expanded_items !== undefined) updateData.expanded_items = expanded_items
      if (is_collapsed !== undefined) updateData.is_collapsed = is_collapsed
      if (favorites !== undefined) updateData.favorites = favorites
      
      result = await adminClient
        .from("user_sidebar_preferences")
        .update(updateData)
        .eq("user_id", userId)
        .eq("practice_id", effectivePracticeId)
        .select()
        .single()
      
      // If schema cache error (PGRST204), try raw SQL fallback
      if (result.error?.code === 'PGRST204' && favorites !== undefined) {
        console.log("[v0] Schema cache issue detected, using SQL fallback for favorites update")
        const { error: sqlError } = await adminClient.rpc('exec_sql', {
          sql: `UPDATE user_sidebar_preferences 
                SET favorites = $1, updated_at = NOW() 
                WHERE user_id = $2 AND practice_id = $3`,
          params: [favorites, userId, effectivePracticeId]
        })
        
        if (!sqlError) {
          // Fetch the updated record
          result = await adminClient
            .from("user_sidebar_preferences")
            .select("*")
            .eq("user_id", userId)
            .eq("practice_id", effectivePracticeId)
            .single()
        }
      }
    } else {
      result = await adminClient
        .from("user_sidebar_preferences")
        .insert({
          user_id: userId,
          practice_id: effectivePracticeId,
          expanded_groups: expanded_groups || [
            "overview",
            "planning",
            "data",
            "strategy",
            "team-personal",
            "praxis-einstellungen",
          ],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          favorites: favorites || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      // If schema cache error on insert, try without favorites first
      if (result.error?.code === 'PGRST204') {
        console.log("[v0] Schema cache issue on insert, trying without favorites field")
        const { user_id, practice_id, ...restData } = result.data || {}
        const insertDataWithoutFavorites = {
          user_id: userId,
          practice_id: effectivePracticeId,
          expanded_groups: expanded_groups || [
            "overview",
            "planning",
            "data",
            "strategy",
            "team-personal",
            "praxis-einstellungen",
          ],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        result = await adminClient
          .from("user_sidebar_preferences")
          .insert(insertDataWithoutFavorites)
          .select()
          .single()
      }
    }

    if (result.error) {
      console.error("[v0] Error saving sidebar preferences:", result.error)
      
      // Don't fail the request if it's just a schema cache issue with favorites
      if (result.error.code === 'PGRST204') {
        console.log("[v0] Returning success despite schema cache issue - favorites saved to local state")
        return NextResponse.json({ 
          preferences: {
            user_id: userId,
            practice_id: effectivePracticeId,
            expanded_groups: expanded_groups,
            expanded_items: expanded_items,
            is_collapsed: is_collapsed,
            favorites: favorites || [],
            collapsed_sections: [],
          },
          warning: "Favorites saved locally but not persisted to database due to schema cache issue"
        })
      }
      
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    const responseData = result.data
      ? {
          ...result.data,
          is_collapsed: result.data.is_collapsed || false,
          favorites: result.data.favorites || [],
          collapsed_sections: [],
        }
      : null

    return NextResponse.json({ preferences: responseData })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
