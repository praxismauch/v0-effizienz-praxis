import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { safeSupabaseQuery, isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ articles: [] })
      }
      throw error
    }

    let query = supabase
      .from("knowledge_base")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.textSearch("search_vector", search, {
        type: "websearch",
        config: "german",
      })
    }

    const { data, error } = await safeSupabaseQuery(() => query, [])

    if (error) {
      if (!isRateLimitError(error)) {
        console.error("[v0] Knowledge base GET - Supabase error:", error)
      }
      return NextResponse.json({ articles: [] })
    }

    return NextResponse.json({ articles: data || [] })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ articles: [] })
    }
    console.error("[v0] Knowledge base GET - Exception:", error)
    return NextResponse.json({ articles: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    if (!body.created_by) {
      return NextResponse.json(
        { error: "User authentication required. Please refresh the page and try again." },
        { status: 401 },
      )
    }

    if (!body.title || !body.category || !body.status || !body.practice_id) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, status, and practice_id are required" },
        { status: 400 },
      )
    }

    const insertData = {
      title: body.title,
      content: body.content || "",
      category: body.category,
      status: body.status,
      tags: body.tags || [],
      practice_id: body.practice_id,
      created_by: body.created_by,
      published_at: body.published_at || null,
    }

    const { data, error } = await supabase.from("knowledge_base").insert([insertData]).select().single()

    if (error) {
      console.error("Supabase error creating knowledge base article:", error)
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Permission denied. You may not have access to create articles for this practice." },
          { status: 403 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in knowledge base POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
