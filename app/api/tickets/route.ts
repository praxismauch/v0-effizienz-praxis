import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    console.log("[v0] GET /api/tickets - Request started")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] GET /api/tickets - Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
    })

    // Check for v0 preview indicators: valid Supabase but no session cookie
    // This happens in v0 because users are authenticated client-side only
    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    const isV0Preview = hasSupabaseConfig && !user

    console.log("[v0] Environment check:", {
      isV0Preview,
      hasSupabaseConfig,
      hasUser: !!user,
    })

    // In v0 preview, when there's Supabase config but no user session,
    // treat it as super admin access
    if (!user && !isV0Preview) {
      console.log("[v0] GET /api/tickets - No authenticated user and not preview, returning 401")
      return NextResponse.json(
        {
          tickets: [],
          count: 0,
          error: "Not authenticated",
          message: "User must be logged in to view tickets",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const priority = searchParams.get("priority")
    const practiceId = searchParams.get("practiceId")

    let isSuperAdmin = false
    let queryClient = supabase

    if (user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("[v0] Error fetching user role:", userError)
      }

      const userRole = userData?.role?.toLowerCase().replace(/_/g, "") || "admin"
      isSuperAdmin = userRole === "superadmin"

      console.log("[v0] User role check:", {
        rawRole: userData?.role,
        normalizedRole: userRole,
        isSuperAdmin,
      })

      if (isSuperAdmin) {
        queryClient = await createAdminClient()
      }
    } else if (isV0Preview) {
      console.log("[v0] Preview environment detected - using admin client with full access")
      queryClient = await createAdminClient()
      isSuperAdmin = true
    }

    console.log("[v0] Using", isSuperAdmin ? "admin client (bypasses RLS)" : "regular client (RLS applies)")

    let query = queryClient.from("tickets").select("*").order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    if (type && type !== "all") {
      query = query.eq("type", type)
    }
    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }
    if (practiceId && !isSuperAdmin) {
      query = query.eq("practice_id", practiceId)
    }

    console.log("[v0] Query filters:", { status, type, priority, practiceId, isSuperAdmin })

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching tickets:", error)
      return NextResponse.json({ tickets: [], error: error.message }, { status: 500 })
    }

    console.log("[v0] Fetched tickets count:", data?.length || 0)
    if (data && data.length > 0) {
      console.log("[v0] First ticket complete data:", {
        id: data[0].id,
        title: data[0].title,
        status: data[0].status,
        priority: data[0].priority,
        type: data[0].type,
        assigned_to: data[0].assigned_to,
        user_email: data[0].user_email,
        user_name: data[0].user_name,
        practice_id: data[0].practice_id,
        created_at: data[0].created_at,
      })
    } else {
      console.log("[v0] No tickets found - Empty result")
    }

    return NextResponse.json({
      tickets: data || [],
      count: data?.length || 0,
      filters: { status, type, priority, practiceId },
      isSuperAdmin,
    })
  } catch (error) {
    console.error("[v0] Error in tickets GET:", error)
    return NextResponse.json(
      {
        tickets: [],
        error: "Failed to fetch tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    console.log("[v0] POST /api/tickets - Starting ticket creation")

    const body = await request.json()

    if (!body.user_email && !body.user_name) {
      console.error("[v0] Missing user information in request body")
      return NextResponse.json({ error: "User information required" }, { status: 400 })
    }

    console.log("[v0] Creating ticket with data:", {
      title: body.title,
      type: body.type,
      priority: body.priority,
      practice_id: body.practice_id,
      user_email: body.user_email,
    })

    const ticketData = {
      title: body.title,
      description: body.description || "",
      type: body.type || "bug",
      priority: body.priority || "medium",
      status: "open",
      practice_id: body.practice_id || null,
      user_id: body.user_id || null,
      user_email: body.user_email,
      user_name: body.user_name,
      category: body.category || null,
      screenshot_urls: body.screenshot_urls || [],
      attachments: body.attachments || [],
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("tickets").insert([ticketData]).select().single()

    if (error) {
      console.error("[v0] Supabase error creating ticket:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("[v0] Ticket saved to database - Complete record:", {
      id: data.id,
      title: data.title,
      status: data.status,
      type: data.type,
      priority: data.priority,
      practice_id: data.practice_id,
      user_email: data.user_email,
      created_at: data.created_at,
    })

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[v0] Exception in tickets POST:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
