import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

function isRateLimitError(error: any): boolean {
  if (!error) return false
  const message = error?.message || String(error)
  return (
    error instanceof SyntaxError ||
    message.includes("Too Many") ||
    message.includes("Unexpected token") ||
    message.includes("is not valid JSON")
  )
}

function deduplicateCategories(categories: any[]): any[] {
  const seen = new Map<string, any>()
  for (const cat of categories) {
    const key = cat.name?.toLowerCase()?.trim()
    if (key && !seen.has(key)) {
      seen.set(key, cat)
    }
  }
  return Array.from(seen.values())
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      return NextResponse.json({ categories: [] }, { status: 200 })
    }

    let data: any[] = []
    let error: any = null

    try {
      const result = await supabase
        .from("orga_categories")
        .select("*")
        .eq("practice_id", String(practiceId))
        .order("display_order", { ascending: true })

      data = result.data || []
      error = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ categories: [] }, { status: 200 })
      }
      return NextResponse.json({ categories: [] }, { status: 200 })
    }

    if (error) {
      return NextResponse.json({ error: "Database error", categories: [] }, { status: 200 })
    }

    if (data && data.length > 0) {
      const deduplicated = deduplicateCategories(data)
      return NextResponse.json({ categories: deduplicated })
    }

    if (!data || data.length === 0) {
      let adminSupabase
      try {
        adminSupabase = await createAdminClient()
      } catch (adminError) {
        console.error("Failed to create admin client:", adminError)
        return NextResponse.json({ categories: [] }, { status: 200 })
      }

      let existingCheck: any[] = []
      try {
        const existingResult = await adminSupabase
          .from("orga_categories")
          .select("*")
          .eq("practice_id", String(practiceId))
          .order("display_order", { ascending: true })

        existingCheck = existingResult.data || []
        if (existingCheck.length > 0) {
          return NextResponse.json({ categories: deduplicateCategories(existingCheck) })
        }
      } catch (recheckError) {
        return NextResponse.json({ categories: [] }, { status: 200 })
      }

      let templateCategories: any[] = []
      try {
        const templateResult = await adminSupabase
          .from("orga_categories")
          .select("*")
          .is("practice_id", null)
          .order("display_order", { ascending: true })

        templateCategories = templateResult.data || []
      } catch (templateError) {
        return NextResponse.json({ categories: [] }, { status: 200 })
      }

      if (templateCategories && templateCategories.length > 0) {
        const uniqueTemplates = deduplicateCategories(templateCategories)

        const categoriesToInsert = uniqueTemplates.map((cat) => ({
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          display_order: cat.display_order,
          practice_id: practiceId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        try {
          const insertResult = await adminSupabase.from("orga_categories").insert(categoriesToInsert).select()

          if (insertResult.error) {
            if (insertResult.error.code === "23505") {
              const fetchResult = await adminSupabase
                .from("orga_categories")
                .select("*")
                .eq("practice_id", String(practiceId))
                .order("display_order", { ascending: true })

              return NextResponse.json({ categories: deduplicateCategories(fetchResult.data || []) })
            }

            console.error("Insert error:", insertResult.error)
            return NextResponse.json({ categories: [] }, { status: 200 })
          }

          return NextResponse.json({ categories: deduplicateCategories(insertResult.data || []) })
        } catch (insertError) {
          return NextResponse.json({ categories: [] }, { status: 200 })
        }
      }

      return NextResponse.json({ categories: [] })
    }

    return NextResponse.json({ categories: deduplicateCategories(data || []) })
  } catch (err) {
    console.error("orga-categories GET - Exception caught:", err)
    return NextResponse.json({ categories: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const supabase = await createAdminClient()

    const { data: existingCategories } = await supabase
      .from("orga_categories")
      .select("display_order")
      .eq("practice_id", String(practiceId))
      .order("display_order", { ascending: false })
      .limit(1)

    const nextOrder = existingCategories && existingCategories.length > 0 ? existingCategories[0].display_order + 1 : 0

    const { data, error } = await supabase
      .from("orga_categories")
      .insert({
        ...body,
        practice_id: practiceId,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error("Create category error:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Create category exception:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
