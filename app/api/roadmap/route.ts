import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Alle Roadmap Items abrufen
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const sortBy = searchParams.get("sortBy") || "priority"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    let query = supabase.from("roadmap_items").select("*").is("deleted_at", null)

    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    // Sortierung nach Priorität mit custom order
    if (sortBy === "priority") {
      // Custom sort: high -> medium -> low
      query = query.order("display_order", { ascending: sortOrder === "asc" })
    } else if (sortBy === "target_date") {
      query = query.order("target_date", { ascending: sortOrder === "asc", nullsFirst: false })
    } else if (sortBy === "created_at") {
      query = query.order("created_at", { ascending: sortOrder === "asc" })
    } else if (sortBy === "votes") {
      query = query.order("votes", { ascending: sortOrder === "desc" })
    } else {
      query = query.order("display_order", { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching roadmap items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sortiere nach Priorität wenn gewünscht
    let sortedData = data || []
    if (sortBy === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3 }
      sortedData = sortedData.sort((a, b) => {
        const orderA = priorityOrder[a.priority as keyof typeof priorityOrder] || 4
        const orderB = priorityOrder[b.priority as keyof typeof priorityOrder] || 4
        return sortOrder === "asc" ? orderA - orderB : orderB - orderA
      })
    }

    return NextResponse.json({ items: sortedData })
  } catch (error) {
    console.error("[v0] Error in GET /api/roadmap:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Neues Roadmap Item erstellen
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const {
      title,
      description,
      status = "planned",
      priority = "medium",
      effort,
      impact,
      category,
      tags,
      target_date,
      assigned_to,
      created_by,
      metadata,
    } = body

    if (!title) {
      return NextResponse.json({ error: "Title ist erforderlich" }, { status: 400 })
    }

    // Get max display_order for priority-based sorting
    const { data: maxOrderData } = await supabase
      .from("roadmap_items")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data, error } = await supabase
      .from("roadmap_items")
      .insert({
        title,
        description,
        status,
        priority,
        effort,
        impact,
        category,
        tags: tags || [],
        target_date,
        assigned_to,
        created_by,
        metadata: metadata || {},
        display_order: nextOrder,
        votes: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating roadmap item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/roadmap:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
