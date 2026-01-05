import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { de } from "date-fns/locale"

// GET check if homeoffice is allowed for a user on a specific date
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const dateStr = searchParams.get("date") // YYYY-MM-DD

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const checkDate = dateStr ? new Date(dateStr) : new Date()
    const supabase = await createAdminClient()

    // Get policy for user (user-specific overrides default)
    const { data: policies, error } = await supabase
      .from("homeoffice_policies")
      .select("*")
      .eq("practice_id", practiceId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("user_id", { ascending: false, nullsFirst: false })
      .limit(1)

    if (error) {
      console.error("[v0] Error fetching policy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const policy = policies?.[0]

    if (!policy) {
      return NextResponse.json({
        allowed: false,
        reason: "Keine Homeoffice-Regelung definiert",
      })
    }

    if (!policy.is_allowed) {
      return NextResponse.json({
        allowed: false,
        reason: "Homeoffice ist nicht erlaubt",
      })
    }

    // Check day of week
    const dayName = format(checkDate, "EEEE", { locale: de }).toLowerCase()
    const dayMap: Record<string, string> = {
      montag: "monday",
      dienstag: "tuesday",
      mittwoch: "wednesday",
      donnerstag: "thursday",
      freitag: "friday",
      samstag: "saturday",
      sonntag: "sunday",
    }
    const englishDay = dayMap[dayName] || dayName

    if (policy.allowed_days && policy.allowed_days.length > 0) {
      if (!policy.allowed_days.includes(englishDay)) {
        return NextResponse.json({
          allowed: false,
          reason: `Homeoffice ist ${dayName}s nicht erlaubt`,
          policy,
        })
      }
    }

    // Check weekly limit
    if (policy.max_days_per_week && policy.max_days_per_week > 0) {
      const startOfWeek = new Date(checkDate)
      startOfWeek.setDate(checkDate.getDate() - checkDate.getDay() + 1) // Monday
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const { data: thisWeekStamps, error: stampsError } = await supabase
        .from("time_stamps")
        .select("work_location, timestamp")
        .eq("practice_id", practiceId)
        .eq("user_id", userId)
        .eq("work_location", "homeoffice")
        .gte("timestamp", startOfWeek.toISOString())
        .lte("timestamp", endOfWeek.toISOString())

      if (stampsError) {
        console.error("[v0] Error checking weekly homeoffice count:", stampsError)
      } else {
        const uniqueDays = new Set(thisWeekStamps?.map((s) => new Date(s.timestamp).toISOString().split("T")[0]))
        const homeofficeCount = uniqueDays.size

        if (homeofficeCount >= policy.max_days_per_week) {
          return NextResponse.json({
            allowed: false,
            reason: `Maximale Homeoffice-Tage (${policy.max_days_per_week}/Woche) erreicht`,
            policy,
          })
        }
      }
    }

    return NextResponse.json({
      allowed: true,
      reason: "Homeoffice erlaubt",
      policy,
    })
  } catch (error) {
    console.error("[v0] Exception in check homeoffice:", error)
    return NextResponse.json({ error: "Failed to check policy" }, { status: 500 })
  }
}
