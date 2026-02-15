import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import Logger from "@/lib/logger"
import { isPracticeAdminRole } from "@/lib/auth-utils"

const PRACTICE_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#F97316", // orange-500
  "#14B8A6", // teal-500
  "#6366F1", // indigo-500
  "#84CC16", // lime-500
  "#A855F7", // purple-500
  "#22C55E", // green-500
  "#0EA5E9", // sky-500
  "#D946EF", // fuchsia-500
  "#FACC15", // yellow-500
]

function getNextAvailableColor(usedColors: string[]): string {
  // Find a color that hasn't been used yet
  for (const color of PRACTICE_COLORS) {
    if (!usedColors.includes(color)) {
      return color
    }
  }
  // If all colors are used, cycle through based on count
  return PRACTICE_COLORS[usedColors.length % PRACTICE_COLORS.length]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const [practicesResult, userCountsResult] = await Promise.all([
      supabase
        .from("practices")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true })
        .limit(10000), // Ensure we get all practices
      supabase.from("users").select("practice_id, role").not("practice_id", "is", null),
    ])

    const { data: practices, error } = practicesResult

    if (error) {
      Logger.error("api", "Error fetching practices from database", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const countsMap = new Map<string, { memberCount: number; adminCount: number }>()

    const { data: userCounts, error: userCountError } = userCountsResult

    if (userCountError) {
      Logger.error("api", "Error fetching user counts", userCountError)
    } else if (userCounts) {
      userCounts.forEach((user) => {
        const practiceId = user.practice_id
        if (!practiceId) return

        if (!countsMap.has(practiceId)) {
          countsMap.set(practiceId, { memberCount: 0, adminCount: 0 })
        }

        const counts = countsMap.get(practiceId)!
        counts.memberCount++

        if (isPracticeAdminRole(user.role)) {
          counts.adminCount++
        }
      })
    }

    const practicesWithCounts = practices.map((practice: any, index: number) => {
      let street = ""
      let city = ""
      let zipCode = ""

      if (practice.address) {
        const addressParts = practice.address.split(", ")
        street = addressParts[0] || ""
        city = addressParts[1] || ""
        zipCode = addressParts[2] || ""
      }

      const isActive = practice.settings?.isActive !== undefined ? practice.settings.isActive : true

      const counts = countsMap.get(practice.id) || { memberCount: 0, adminCount: 0 }

      return {
        id: practice.id,
        name: practice.name,
        type: practice.type,
        street,
        city,
        zipCode,
        address: practice.address,
        phone: practice.phone,
        email: practice.email,
        website: practice.website,
        timezone: practice.timezone,
        currency: practice.currency,
        createdAt: practice.created_at,
        isActive,
        adminCount: counts.adminCount,
        memberCount: counts.memberCount,
        lastActivity: new Date().toISOString(),
        color: practice.color || PRACTICE_COLORS[index % PRACTICE_COLORS.length],
      }
    })

    Logger.info("api", "GET /api/practices - Success", { count: practicesWithCounts.length })

    const response = NextResponse.json({ practices: practicesWithCounts })
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60")
    return response
  } catch (error) {
    Logger.error("api", "Error in GET /api/practices", error)
    return NextResponse.json(
      {
        error: "Failed to fetch practices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/practices - Request received")
    const body = await request.json()
    console.log("[v0] POST /api/practices - Body:", { ...body, bundesland: body.bundesland })
    const { name, type, street, city, zipCode, phone, email, website, timezone, currency, isActive, bundesland } = body

    // Use admin client to bypass RLS - this route is already protected by the proxy
    const supabase = await createAdminClient()

    const { data: existingPractices, error: fetchError } = await supabase
      .from("practices")
      .select("id, color")
      .order("created_at", { ascending: false })

    if (fetchError) {
      Logger.error("api", "Error fetching existing practices", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const usedColors = (existingPractices || []).map((p) => p.color).filter(Boolean) as string[]
    const assignedColor = getNextAvailableColor(usedColors)

    const address = [street, city, zipCode].filter(Boolean).join(", ")

    // Get current user to set created_by
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    const practiceData = {
      // id will be auto-generated by database default gen_random_uuid()
      name,
      type,
      address,
      bundesland: bundesland || null,
      street: street || "",
      city: city || "",
      zip_code: zipCode || "",
      phone: phone || "",
      email: email || "",
      website: website || "",
      timezone: timezone || "Europe/Berlin",
      currency: currency || "EUR",
      color: assignedColor,
      approval_status: "approved", // Super admin creates are auto-approved
      created_by: user?.id || null,
      settings: {
        isActive: isActive !== false,
      },
    }

    const { data, error } = await supabase.from("practices").insert(practiceData).select().single()

    if (error) {
      Logger.error("api", "Error creating practice", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Link the user to the newly created practice
    if (user?.id) {
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ 
          practice_id: data.id,
          default_practice_id: data.id 
        })
        .eq("id", user.id)

      if (updateUserError) {
        Logger.error("api", "Error linking user to practice", updateUserError)
        // Don't fail the request - practice was created successfully
      } else {
        Logger.info("api", "User linked to practice", { userId: user.id, practiceId: data.id })
      }
    }

    let defaultTeamsCreated = false
    try {
      const { data: defaultTeamsData, error: defaultTeamsError } = await supabase
        .from("default_teams")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!defaultTeamsError && defaultTeamsData && defaultTeamsData.length > 0) {
        const defaultTeams = defaultTeamsData.map((dt) => ({
          practice_id: String(data.id), // Ensure TEXT type
          name: dt.name,
          color: dt.color || "#64748b",
          description: dt.description,
          is_active: true,
        }))

        const { error: teamsError } = await supabase.from("teams").insert(defaultTeams)

        if (!teamsError) {
          defaultTeamsCreated = true
          Logger.info("api", "Default teams created for practice", {
            practiceId: data.id,
            teamsCount: defaultTeams.length,
          })
        }
      }
    } catch (teamsErr) {
      Logger.info("api", "Default teams setup skipped - table may not exist", { practiceId: data.id })
    }

    const addressParts = data.address?.split(", ") || []
    const practiceWithParts = {
      id: data.id,
      name: data.name,
      type: data.type,
      street: addressParts[0] || "",
      city: addressParts[1] || "",
      zipCode: addressParts[2] || "",
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      timezone: data.timezone,
      currency: data.currency,
      createdAt: data.created_at,
      isActive: data.settings?.isActive !== undefined ? data.settings.isActive : true,
      adminCount: 0,
      memberCount: 0,
      lastActivity: new Date().toISOString(),
      color: data.color || assignedColor,
    }

    Logger.info("api", "Practice created", { practiceId: data.id, name: data.name, color: assignedColor })
    return NextResponse.json({ practice: practiceWithParts, message: "Practice created successfully" })
  } catch (error) {
    Logger.error("api", "Error in POST /api/practices", error)
    return NextResponse.json(
      {
        error: "Failed to create practice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
