import { createAdminClient } from "@/lib/supabase/server"
import { apiSuccess, apiError, apiBadRequest, apiDatabaseError } from "@/lib/api/responses"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    if (!userId || userId === "undefined") {
      return apiBadRequest("Missing userId")
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("user_sidebar_preferences")
      .select("expanded_items")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching analytics settings:", error)
      return apiDatabaseError("Failed to fetch analytics settings")
    }

    // Extract analytics settings from expanded_items jsonb
    const analyticsSettings = data?.expanded_items?.analyticsSettings || null

    return apiSuccess({
      analyticsLayout: analyticsSettings?.layout || null,
      analyticsTabs: analyticsSettings?.tabs || null,
      systemDiagrams: analyticsSettings?.systemDiagrams || null,
      customDiagrams: analyticsSettings?.customDiagrams || null,
      dashboardTiles: analyticsSettings?.dashboardTiles || null,
    })
  } catch (error) {
    console.error("Error in GET analytics-settings:", error)
    return apiError("Failed to fetch analytics settings", 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    if (!userId || userId === "undefined") {
      return apiBadRequest("Missing userId")
    }

    const body = await request.json()
    const { analyticsLayout, analyticsTabs, systemDiagrams, customDiagrams, dashboardTiles } = body

    const supabase = await createAdminClient()

    // First, get existing expanded_items
    const { data: existing } = await supabase
      .from("user_sidebar_preferences")
      .select("expanded_items")
      .eq("user_id", userId)
      .maybeSingle()

    const currentExpandedItems = existing?.expanded_items || {}

    // Merge analytics settings into expanded_items
    const analyticsSettings = {
      ...(currentExpandedItems.analyticsSettings || {}),
      ...(analyticsLayout !== undefined && { layout: analyticsLayout }),
      ...(analyticsTabs !== undefined && { tabs: analyticsTabs }),
      ...(systemDiagrams !== undefined && { systemDiagrams }),
      ...(customDiagrams !== undefined && { customDiagrams }),
      ...(dashboardTiles !== undefined && { dashboardTiles }),
    }

    const newExpandedItems = {
      ...currentExpandedItems,
      analyticsSettings,
    }

    // Upsert the preferences
    const { data, error } = await supabase
      .from("user_sidebar_preferences")
      .upsert(
        {
          user_id: userId,
          expanded_items: newExpandedItems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving analytics settings:", error)
      return apiDatabaseError("Failed to save analytics settings")
    }

    return apiSuccess({ success: true, analyticsSettings })
  } catch (error) {
    console.error("Error in PUT analytics-settings:", error)
    return apiError("Failed to save analytics settings", 500)
  }
}
