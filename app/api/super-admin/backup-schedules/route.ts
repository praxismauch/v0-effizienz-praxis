import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("backup_schedules")
      .select(`
        *,
        practice:practices(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [], {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching backup schedules:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup schedules" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const isPreview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview" ||
      !process.env.NEXT_PUBLIC_VERCEL_ENV

    let userId: string

    if (isPreview) {
      // In preview, use a default user ID
      userId = "36883b61-34e4-4b9e-8a11-eb1a9656d2a0"
      console.log("[v0] Using preview environment user ID for schedule creation")
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }
      userId = user.id
    }

    const body = await request.json()

    const {
      practiceId,
      scheduleType,
      backupScope,
      timeOfDay = "02:00:00",
      dayOfWeek,
      dayOfMonth,
      retentionDays = 30,
    } = body

    // Calculate next run time
    const nextRunAt = calculateNextRun(scheduleType, timeOfDay, dayOfWeek, dayOfMonth)

    const scheduleData = {
      practice_id: practiceId || null,
      schedule_type: scheduleType,
      backup_scope: backupScope,
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      day_of_month: dayOfMonth,
      retention_days: retentionDays,
      next_run_at: nextRunAt,
      created_by: userId,
      is_active: true,
    }

    const { data, error } = await adminClient.from("backup_schedules").insert(scheduleData).select().single()

    if (error) throw error

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error creating backup schedule:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create backup schedule" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { id, isActive, ...scheduleData } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // If only toggling active state
    if (isActive !== undefined && Object.keys(scheduleData).length === 0) {
      const { data, error } = await supabase
        .from("backup_schedules")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data, {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Full schedule update
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (isActive !== undefined) updateData.is_active = isActive
    if (scheduleData.practiceId !== undefined) updateData.practice_id = scheduleData.practiceId === "all" ? null : scheduleData.practiceId
    if (scheduleData.scheduleType) updateData.schedule_type = scheduleData.scheduleType
    if (scheduleData.backupScope) updateData.backup_scope = scheduleData.backupScope
    if (scheduleData.timeOfDay) updateData.time_of_day = scheduleData.timeOfDay
    if (scheduleData.dayOfWeek !== undefined) updateData.day_of_week = scheduleData.dayOfWeek
    if (scheduleData.dayOfMonth !== undefined) updateData.day_of_month = scheduleData.dayOfMonth
    if (scheduleData.retentionDays !== undefined) updateData.retention_days = scheduleData.retentionDays

    // Recalculate next run if schedule parameters changed
    if (updateData.schedule_type || updateData.time_of_day || updateData.day_of_week || updateData.day_of_month) {
      const scheduleType = updateData.schedule_type || scheduleData.scheduleType
      const timeOfDay = updateData.time_of_day || scheduleData.timeOfDay || "02:00"
      const dayOfWeek = updateData.day_of_week ?? scheduleData.dayOfWeek
      const dayOfMonth = updateData.day_of_month ?? scheduleData.dayOfMonth
      updateData.next_run_at = calculateNextRun(scheduleType, timeOfDay, dayOfWeek, dayOfMonth)
    }

    const { data, error } = await supabase
      .from("backup_schedules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[v0] Error updating backup schedule:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update backup schedule" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { id, isActive } = body

    const { data, error } = await supabase
      .from("backup_schedules")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error updating backup schedule:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update backup schedule" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

function calculateNextRun(scheduleType: string, timeOfDay: string, dayOfWeek?: number, dayOfMonth?: number): string {
  const now = new Date()
  const [hours, minutes] = timeOfDay.split(":").map(Number)

  const nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  if (scheduleType === "daily") {
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (scheduleType === "weekly" && dayOfWeek !== undefined) {
    while (nextRun.getDay() !== dayOfWeek || nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (scheduleType === "monthly" && dayOfMonth !== undefined) {
    nextRun.setDate(dayOfMonth)
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
  }

  return nextRun.toISOString()
}
