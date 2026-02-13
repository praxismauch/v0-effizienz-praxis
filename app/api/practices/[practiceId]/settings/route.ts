import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"
import { isRateLimitError } from "@/lib/supabase/rate-limit-handler"

const DEFAULT_SETTINGS = {
  system_settings: null,
  display_settings: null,
  calendar_settings: null,
  working_hours_settings: null,
  notification_settings: null,
  security_settings: null,
}

function getEffectivePracticeId(practiceId: string | undefined): string {
  if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
    return "1"
  }
  return practiceId
}

// GET - Fetch practice settings
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    let access
    try {
      access = await requirePracticeAccess(practiceId)
    } catch (authError: any) {
      // For GET settings, return defaults if not authenticated (graceful fallback)
      if (authError.message?.includes("rate limit") || isRateLimitError(authError)) {
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
      }
      return NextResponse.json({ error: "Not authenticated", settings: DEFAULT_SETTINGS }, { status: 401 })
    }

    const supabase = access.adminClient

    let practiceSettingsData: any[] | null = null
    try {
      const result = await supabase.from("practice_settings").select("*").eq("practice_id", practiceId)

      if (result.error) {
        if (isRateLimitError(result.error)) {
          return NextResponse.json({ settings: DEFAULT_SETTINGS })
        }
      } else {
        practiceSettingsData = result.data
      }
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
      }
    }

    if (practiceSettingsData && practiceSettingsData.length > 0) {
      const settings = practiceSettingsData[0]
      return NextResponse.json({
        settings: {
          system_settings: settings.system_settings,
          display_settings: settings.display_settings || null,
          calendar_settings: settings.calendar_settings || null,
          working_hours_settings: settings.working_hours_settings || null,
          notification_settings: settings.notification_settings,
          security_settings: settings.security_settings,
        },
      })
    }

    // Fall back to practices table
    let data: any = null
    try {
      const result = await supabase.from("practices").select("settings").eq("id", practiceId).maybeSingle()
      if (result.error) {
        if (isRateLimitError(result.error)) {
          return NextResponse.json({ settings: DEFAULT_SETTINGS })
        }
        if (result.error.code === "42703") {
          return NextResponse.json({ settings: DEFAULT_SETTINGS })
        }
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
      }
      data = result.data
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
      }
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    if (!data) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    return NextResponse.json({ settings: data?.settings || DEFAULT_SETTINGS })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  return PUT(request, { params })
}

// PATCH - Update practice basic information (name, address, contact info)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)
    console.log("[v0] PATCH settings route hit, practiceId:", practiceId)

    let access
    try {
      access = await requirePracticeAccess(practiceId)
    } catch (authError: any) {
      console.error("[v0] PATCH auth error:", authError.message)
      return NextResponse.json({ error: authError.message || "Authentication failed" }, { status: authError.status || 401 })
    }
    const supabase = access.adminClient

    const body = await request.json()

    console.log("[v0] Updating practice info for practice:", practiceId, "body keys:", Object.keys(body))

    // Only include defined fields to avoid Supabase rejecting undefined values
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    const allowedFields = ["name", "address", "phone", "fax", "email", "website", "description", "practice_type", "specialization", "logo_url"]
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field]
      }
    }

    console.log("[v0] Update payload fields:", Object.keys(updatePayload))

    const { data, error } = await supabase
      .from("practices")
      .update(updatePayload)
      .eq("id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating practice:", JSON.stringify(error))
      throw error
    }

    return NextResponse.json({ practice: data })
  } catch (error: any) {
    console.error("[v0] Error updating practice info:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update practice information",
      },
      { status: 500 },
    )
  }
}

// PUT - Update practice settings
export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    console.log("[v0] Updating practice settings for practice:", practiceId, "by user:", access.user.id)

    const { data: existingSettings } = await supabase
      .from("practice_settings")
      .select("id")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (existingSettings) {
      // Update practice_settings table
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }
      if (body.system_settings !== undefined) updatePayload.system_settings = body.system_settings
      if (body.notification_settings !== undefined) updatePayload.notification_settings = body.notification_settings
      if (body.security_settings !== undefined) updatePayload.security_settings = body.security_settings
      if (body.working_hours_settings !== undefined) updatePayload.working_hours_settings = body.working_hours_settings
      if (body.calendar_settings !== undefined) updatePayload.calendar_settings = body.calendar_settings
      if (body.display_settings !== undefined) updatePayload.display_settings = body.display_settings

      const { data, error } = await supabase
        .from("practice_settings")
        .update(updatePayload)
        .eq("practice_id", practiceId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating practice_settings:", error)
        throw error
      }

      return NextResponse.json({
        settings: {
          system_settings: data.system_settings,
          display_settings: data.display_settings,
          calendar_settings: data.calendar_settings,
          working_hours_settings: data.working_hours_settings,
          notification_settings: data.notification_settings,
          security_settings: data.security_settings,
        },
      })
    } else {
      // Create new entry in practice_settings table
      const { data, error } = await supabase
        .from("practice_settings")
        .insert({
          practice_id: practiceId,
          system_settings: body.system_settings || null,
          notification_settings: body.notification_settings || null,
          security_settings: body.security_settings || null,
          working_hours_settings: body.working_hours_settings || null,
          calendar_settings: body.calendar_settings || null,
          display_settings: body.display_settings || null,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating practice_settings:", error)
        // Fall back to practices table if practice_settings doesn't exist
        return updatePracticesTable()
      }

      return NextResponse.json({
        settings: {
          system_settings: data.system_settings,
          display_settings: data.display_settings,
          calendar_settings: data.calendar_settings,
          working_hours_settings: data.working_hours_settings,
          notification_settings: data.notification_settings,
          security_settings: data.security_settings,
        },
      })
    }

    async function updatePracticesTable() {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("practices")
        .update({
          settings: {
            system_settings: body.system_settings || null,
            display_settings: body.display_settings || null,
            calendar_settings: body.calendar_settings || null,
            notification_settings: body.notification_settings || null,
            security_settings: body.security_settings || null,
          },
          updated_at: now,
        })
        .eq("id", practiceId)
        .select("settings")
        .single()

      if (error) {
        if (error.code === "42703") {
          return NextResponse.json(
            {
              error: "Settings column not found. Please run migration script.",
              requiresMigration: true,
            },
            { status: 400 },
          )
        }
        throw error
      }

      return NextResponse.json({ settings: data?.settings })
    }
  } catch (error: any) {
    console.error("[v0] Error updating practice settings:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update practice settings",
      },
      { status: 500 },
    )
  }
}
