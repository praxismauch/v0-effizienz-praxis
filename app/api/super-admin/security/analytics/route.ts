import { createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"
import { NextResponse, type NextRequest } from "next/server"
import { getSecurityAnalytics } from "@/lib/api/anomaly-detection"

/**
 * GET /api/super-admin/security/analytics
 * 
 * Get security analytics and monitoring data
 * Requires super admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify super admin authentication
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // 2. Check if user is super admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json(
        { error: "Nur Super-Administratoren haben Zugriff" },
        { status: 403 }
      )
    }

    // 3. Get hours parameter
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get("hours") || "24", 10)

    // 4. Fetch security analytics
    const analytics = await getSecurityAnalytics(hours)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[v0] Error fetching security analytics:", error)
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Sicherheitsanalysen" },
      { status: 500 }
    )
  }
}
