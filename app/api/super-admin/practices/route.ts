import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Logger from "@/lib/logger"
import { isPracticeAdminRole, isSuperAdminRole } from "@/lib/auth-utils"
import { getCacheHeaders } from "@/lib/cache-config"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Logger.error("api", "Unauthorized access to super-admin practices", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (userError || !userData || !isSuperAdminRole(userData.role)) {
      Logger.error("api", "Non-super-admin attempted to access practices", { userId: user.id })
      return NextResponse.json({ error: "Forbidden: Super admin access required" }, { status: 403 })
    }

    const { data: practices, error: practicesError } = await supabase
      .from("practices")
      .select("*")
      .order("name", { ascending: true })
      .limit(10000) // Ensure we get all practices

    if (practicesError) {
      Logger.error("api", "Error fetching practices from database", practicesError)
      return NextResponse.json({ error: practicesError.message }, { status: 500 })
    }

    console.log("[v0] Super admin practices fetched:", practices?.length || 0)

    const { data: practiceUsersData, error: practiceUsersError } = await supabase
      .from("practice_users")
      .select("practice_id, role, status")
      .eq("status", "active")

    const countsMap = new Map<number, { memberCount: number; adminCount: number }>()

    if (!practiceUsersError && practiceUsersData) {
      practiceUsersData.forEach((pu) => {
        if (!pu.practice_id) return

        if (!countsMap.has(pu.practice_id)) {
          countsMap.set(pu.practice_id, { memberCount: 0, adminCount: 0 })
        }

        const counts = countsMap.get(pu.practice_id)!
        counts.memberCount++

        if (isPracticeAdminRole(pu.role)) {
          counts.adminCount++
        }
      })
    }

    const { data: legacyUsers, error: legacyUsersError } = await supabase
      .from("users")
      .select("practice_id, role")
      .not("practice_id", "is", null)

    if (!legacyUsersError && legacyUsers) {
      legacyUsers.forEach((user) => {
        if (!user.practice_id) return

        const practiceId = Number(user.practice_id)
        if (isNaN(practiceId)) return

        if (!countsMap.has(practiceId)) {
          countsMap.set(practiceId, { memberCount: 0, adminCount: 0 })
        }

        const counts = countsMap.get(practiceId)!
        // Only increment if not already counted via practice_users
        // This prevents double counting
        const hasPracticeUser = practiceUsersData?.some((pu) => pu.practice_id === practiceId)
        if (!hasPracticeUser) {
          counts.memberCount++
          if (isPracticeAdminRole(user.role)) {
            counts.adminCount++
          }
        }
      })
    }

    const practicesWithDetails = practices?.map((practice) => {
      const addressParts = practice.address?.split(", ") || []
      const counts = countsMap.get(practice.id) || { memberCount: 0, adminCount: 0 }

      return {
        id: practice.id,
        name: practice.name,
        type: practice.type || "Nicht angegeben",
        street: addressParts[0] || "",
        city: addressParts[1] || "",
        zipCode: addressParts[2] || "",
        address: practice.address || "",
        phone: practice.phone || "",
        email: practice.email || "",
        website: practice.website || "",
        timezone: practice.timezone || "Europe/Berlin",
        currency: practice.currency || "EUR",
        color: practice.color || "#3B82F6",
        logo_url: practice.logo_url || null,
        ai_enabled: practice.ai_enabled || false,
        isActive: practice.settings?.isActive !== undefined ? practice.settings.isActive : true,
        created_at: practice.created_at,
        deleted_at: practice.deleted_at || null,
        memberCount: counts.memberCount,
        adminCount: counts.adminCount,
        lastActivity: practice.updated_at || practice.created_at,
        settings: practice.settings || {},
      }
    })

    Logger.info("api", "GET /api/super-admin/practices - Success", {
      count: practicesWithDetails?.length || 0,
      userId: user.id,
    })

    return NextResponse.json({
      practices: practicesWithDetails || [],
      total: practicesWithDetails?.length || 0,
    })
  } catch (error) {
    Logger.error("api", "Error in GET /api/super-admin/practices", error)
    return NextResponse.json(
      {
        error: "Failed to fetch practices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
