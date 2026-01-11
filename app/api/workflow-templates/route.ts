import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] Workflow templates GET - Rate limited creating client")
        return NextResponse.json({ templates: [] }, { status: 200 })
      }
      throw clientError
    }

    let templates = null
    let error = null

    try {
      const result = await supabase
        .from("workflow_templates")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false })
        .order("created_at", { ascending: false })

      templates = result.data
      error = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Workflow templates GET - Rate limited during query")
        return NextResponse.json({ templates: [] }, { status: 200 })
      }
      return NextResponse.json({ templates: [] }, { status: 200 })
    }

    if (error) {
      return NextResponse.json({ templates: [] }, { status: 200 })
    }

    return NextResponse.json({ templates: templates || [] }, { status: 200 })
  } catch (error: unknown) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Workflow templates GET - Rate limited (outer catch)")
      return NextResponse.json({ templates: [] }, { status: 200 })
    }
    return NextResponse.json({ templates: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data: template, error } = await supabase
      .from("workflow_templates")
      .insert({
        name: body.name || body.title,
        description: body.description,
        category: body.category,
        steps: body.steps,
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating workflow template:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create workflow template"
    console.error("[API] Unexpected error creating workflow template:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
