import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, getServiceRoleClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    console.log("[v0] GET /api/system-changes - Starting request")

    const supabase = await createServerClient()

    const isV0Preview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview"

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] GET /api/system-changes - Auth check:", {
      hasUser: !!user,
      isV0Preview,
    })

    if (!user && !isV0Preview) {
      console.log("[v0] GET /api/system-changes - No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user) {
      console.log("[v0] GET /api/system-changes - User ID:", user.id)

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        console.log("[v0] GET /api/system-changes - User is not super admin, role:", userData?.role)
        return NextResponse.json({ error: "Forbidden: Super admin access required" }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const includeAggregated = searchParams.get("includeAggregated") === "true"
    const changeType = searchParams.get("changeType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("[v0] GET /api/system-changes - Query params:", { includeAggregated, changeType, startDate, endDate })

    const serviceClient = getServiceRoleClient()

    let query = serviceClient.from("system_changes").select("*").order("created_at", { ascending: false })

    if (!includeAggregated) {
      query = query.eq("is_aggregated", false)
    }

    if (changeType) {
      query = query.eq("change_type", changeType)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching system changes:", error)
      return NextResponse.json({ error: "Failed to fetch system changes" }, { status: 500 })
    }

    console.log("[v0] GET /api/system-changes - Successfully fetched", data?.length || 0, "changes")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] System changes error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden: Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { changeIds, version } = body

    if (!changeIds || !Array.isArray(changeIds) || changeIds.length === 0) {
      return NextResponse.json({ error: "Change IDs required" }, { status: 400 })
    }

    const serviceClient = getServiceRoleClient()

    const { data: changes, error: fetchError } = await serviceClient
      .from("system_changes")
      .select("*")
      .in("id", changeIds)

    if (fetchError) {
      console.error("[v0] Error fetching changes:", fetchError)
      return NextResponse.json({ error: "Failed to fetch changes" }, { status: 500 })
    }

    const groupedChanges = changes.reduce((acc: any, change) => {
      const category = change.change_type || "other"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(change.title)
      return acc
    }, {})

    const changelogChanges = Object.entries(groupedChanges).map(([category, items]) => ({
      category: getCategoryLabel(category),
      items: items as string[],
    }))

    const { error: createError } = await serviceClient.from("changelogs").insert({
      version: version || new Date().toISOString().split("T")[0],
      title: `System-Update ${version || new Date().toLocaleDateString("de-DE")}`,
      description: `Automatisch generierter Changelog aus ${changes.length} System-Änderungen`,
      changes: changelogChanges,
      change_type: "minor",
      is_published: false,
      release_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    })

    if (createError) {
      console.error("[v0] Error creating changelog:", createError)
      return NextResponse.json({ error: "Failed to create changelog" }, { status: 500 })
    }

    const { error: updateError } = await serviceClient
      .from("system_changes")
      .update({ is_aggregated: true })
      .in("id", changeIds)

    if (updateError) {
      console.error("[v0] Error marking changes as aggregated:", updateError)
    }

    return NextResponse.json({ success: true, message: "Changelog created successfully" })
  } catch (error) {
    console.error("[v0] System changes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] DELETE /api/system-changes - Starting request")

    const supabase = await createServerClient()

    const isV0Preview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview"

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] DELETE /api/system-changes - Auth check:", {
      hasUser: !!user,
      isV0Preview,
    })

    if (!user && !isV0Preview) {
      console.log("[v0] DELETE /api/system-changes - No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        console.log("[v0] DELETE /api/system-changes - User is not super admin")
        return NextResponse.json({ error: "Forbidden: Super admin access required" }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const changeIds = searchParams.get("changeIds")

    if (!changeIds) {
      console.log("[v0] DELETE /api/system-changes - No change IDs provided")
      return NextResponse.json({ error: "Change IDs required" }, { status: 400 })
    }

    const serviceClient = getServiceRoleClient()

    const { error: deleteError } = await serviceClient.from("system_changes").delete().in("id", changeIds.split(","))

    if (deleteError) {
      console.error("[v0] Error deleting system changes:", deleteError)
      return NextResponse.json({ error: "Failed to delete system changes" }, { status: 500 })
    }

    console.log("[v0] DELETE /api/system-changes - Successfully deleted changes")
    return NextResponse.json({ success: true, message: "Changes deleted successfully" })
  } catch (error) {
    console.error("[v0] System changes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    feature: "Neue Funktionen",
    bugfix: "Fehlerbehebungen",
    improvement: "Verbesserungen",
    security: "Sicherheit",
    database: "Datenbank",
    api: "API-Änderungen",
    ui: "Benutzeroberfläche",
    configuration: "Konfiguration",
  }
  return labels[category] || "Sonstiges"
}
