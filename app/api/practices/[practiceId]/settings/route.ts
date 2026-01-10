import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"
import { isRateLimitError } from "@/lib/supabase/rate-limit-handler"

const DEFAULT_SETTINGS = {
  system_settings: null,
  display_settings: null,
  calendar_settings: null,
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
          display_settings: null,
          calendar_settings: null,
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
      const { data, error } = await supabase
        .from("practice_settings")
        .update({
          system_settings: body.system_settings || null,
          notification_settings: body.notification_settings || null,
          security_settings: body.security_settings || null,
          updated_at: new Date().toISOString(),
        })
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
