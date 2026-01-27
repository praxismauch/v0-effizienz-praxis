import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check for v0 preview indicators
    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    const isV0Preview = hasSupabaseConfig && !user

    if (!user && !isV0Preview) {
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
        console.error("Error fetching user role:", userError)
      }

      const userRole = userData?.role?.toLowerCase().replace(/_/g, "") || "admin"
      isSuperAdmin = userRole === "superadmin"

      if (isSuperAdmin) {
        queryClient = await createAdminClient()
      }
    } else if (isV0Preview) {
      queryClient = await createAdminClient()
      isSuperAdmin = true
    }

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

    const { data, error } = await query

    if (error) {
      console.error("Error fetching tickets:", error)
      return NextResponse.json({ tickets: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      tickets: data || [],
      count: data?.length || 0,
      filters: { status, type, priority, practiceId },
      isSuperAdmin,
    })
  } catch (error) {
    console.error("Error in tickets GET:", error)
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

    const body = await request.json()

    if (!body.user_email && !body.user_name) {
      console.error("Missing user information in request body")
      return NextResponse.json({ error: "User information required" }, { status: 400 })
    }

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
      console.error("Supabase error creating ticket:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("Exception in tickets POST:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
