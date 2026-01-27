import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - Fetch all feature flags with optional practice-specific overrides
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get practice_id from query params (optional)
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    // Fetch all feature flags ordered by display_order
    const { data: features, error } = await adminClient
      .from("feature_flags")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching feature flags:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If practice_id is provided, fetch overrides for that practice
    let practiceOverrides: Record<string, { is_enabled: boolean | null; is_beta: boolean | null }> = {}
    if (practiceId) {
      const { data: overrides } = await adminClient
        .from("practice_feature_overrides")
        .select("feature_key, is_enabled, is_beta")
        .eq("practice_id", practiceId)

      if (overrides) {
        practiceOverrides = overrides.reduce(
          (acc, o) => {
            acc[o.feature_key] = { is_enabled: o.is_enabled, is_beta: o.is_beta }
            return acc
          },
          {} as Record<string, { is_enabled: boolean | null; is_beta: boolean | null }>,
        )
      }
    }

    // Fetch all practices for the dropdown
    const { data: practices } = await adminClient
      .from("practices")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true })

    return NextResponse.json({
      features,
      practiceOverrides,
      practices: practices || [],
    })
  } catch (error) {
    console.error("Error in feature flags GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a feature flag (global or practice-specific)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { feature_key, is_enabled, is_beta, practice_id } = body

    if (!feature_key) {
      return NextResponse.json({ error: "feature_key is required" }, { status: 400 })
    }

    // Check if feature exists and get its properties
    const { data: existingFeature } = await adminClient
      .from("feature_flags")
      .select("is_protected, allow_practice_override")
      .eq("feature_key", feature_key)
      .single()

    if (!existingFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    if (existingFeature.is_protected && is_enabled === false) {
      return NextResponse.json(
        {
          error: "Diese Funktion ist geschützt und kann nicht deaktiviert werden",
        },
        { status: 400 },
      )
    }

    // If practice_id is provided, update practice-specific override
    if (practice_id) {
      if (!existingFeature.allow_practice_override) {
        return NextResponse.json(
          {
            error: "Diese Funktion kann nicht pro Praxis überschrieben werden",
          },
          { status: 400 },
        )
      }

      // Upsert the practice override
      const { data: override, error } = await adminClient
        .from("practice_feature_overrides")
        .upsert(
          {
            practice_id,
            feature_key,
            is_enabled: typeof is_enabled === "boolean" ? is_enabled : null,
            is_beta: typeof is_beta === "boolean" ? is_beta : null,
            updated_by: user.id,
          },
          {
            onConflict: "practice_id,feature_key",
          },
        )
        .select()
        .single()

      if (error) {
        console.error("Error updating practice feature override:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ override, scope: "practice" })
    }

    // Otherwise, update the global feature flag
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
    }

    if (typeof is_enabled === "boolean") {
      updateData.is_enabled = is_enabled
    }
    if (typeof is_beta === "boolean") {
      updateData.is_beta = is_beta
    }

    const { data: feature, error } = await adminClient
      .from("feature_flags")
      .update(updateData)
      .eq("feature_key", feature_key)
      .select()
      .single()

    if (error) {
      console.error("Error updating feature flag:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ feature, scope: "global" })
  } catch (error) {
    console.error("Error in feature flags PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove practice-specific override (revert to global)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")
    const featureKey = searchParams.get("feature_key")

    if (!practiceId || !featureKey) {
      return NextResponse.json({ error: "practice_id and feature_key are required" }, { status: 400 })
    }

    const { error } = await adminClient
      .from("practice_feature_overrides")
      .delete()
      .eq("practice_id", practiceId)
      .eq("feature_key", featureKey)

    if (error) {
      console.error("Error deleting practice override:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in feature flags DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Bulk update or sync features
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, features, practice_id } = body

    if (action === "bulk_update" && Array.isArray(features)) {
      const results = []

      for (const feature of features) {
        if (feature.is_protected && feature.is_enabled === false) {
          results.push({ feature_key: feature.feature_key, error: "Protected feature" })
          continue
        }

        if (practice_id) {
          // Bulk update practice overrides
          const { data, error } = await adminClient
            .from("practice_feature_overrides")
            .upsert(
              {
                practice_id,
                feature_key: feature.feature_key,
                is_enabled: feature.is_enabled,
                is_beta: feature.is_beta,
                updated_by: user.id,
              },
              { onConflict: "practice_id,feature_key" },
            )
            .select()
            .single()

          results.push({ feature_key: feature.feature_key, success: !error, data, error: error?.message })
        } else {
          // Bulk update global flags
          const { data, error } = await adminClient
            .from("feature_flags")
            .update({
              is_enabled: feature.is_enabled,
              is_beta: feature.is_beta,
              updated_by: user.id,
            })
            .eq("feature_key", feature.feature_key)
            .select()
            .single()

          results.push({ feature_key: feature.feature_key, success: !error, data, error: error?.message })
        }
      }
      return NextResponse.json({ results })
    }

    if (action === "copy_to_practice" && practice_id) {
      // Copy all global settings to a specific practice as overrides
      const { data: allFeatures } = await adminClient.from("feature_flags").select("feature_key, is_enabled, is_beta")

      if (allFeatures) {
        const inserts = allFeatures.map((f) => ({
          practice_id,
          feature_key: f.feature_key,
          is_enabled: f.is_enabled,
          is_beta: f.is_beta,
          updated_by: user.id,
        }))

        const { error } = await adminClient
          .from("practice_feature_overrides")
          .upsert(inserts, { onConflict: "practice_id,feature_key" })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, message: "Settings copied to practice" })
    }

    if (action === "reset_practice" && practice_id) {
      // Remove all practice-specific overrides (revert to global)
      const { error } = await adminClient.from("practice_feature_overrides").delete().eq("practice_id", practice_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Practice settings reset to global" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in feature flags POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
