import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/rate-limit-handler"

// GET - Fetch all parameters for a specific practice
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError: any) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json({ parameters: [] })
      }
      return NextResponse.json({ parameters: [] })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let practiceQuery = supabase.from("analytics_parameters").select("*").order("created_at", { ascending: false })

    if (category && category !== "all") {
      practiceQuery = practiceQuery.eq("category", category)
    }

    let practiceParameters: any[] = []
    try {
      const result = await practiceQuery
      if (result.error) {
        if (isRateLimitError(result.error)) {
          return NextResponse.json({ parameters: [] })
        }
        return NextResponse.json({ parameters: [] })
      }
      practiceParameters = result.data || []
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ parameters: [] })
      }
      return NextResponse.json({ parameters: [] })
    }

    // Transform practice-specific parameters
    const transformedPracticeParameters = (practiceParameters || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      type: p.data_type,
      interval: p.interval,
      isActive: true,
      isGlobal: p.is_global || false,
      practiceId: p.practice_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      unit: p.unit,
    }))

    return NextResponse.json({ parameters: transformedPracticeParameters })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ parameters: [] })
    }
    return NextResponse.json({ parameters: [] })
  }
}

// POST - Create a new parameter from a template
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    console.log("[v0] Creating parameter for practice:", practiceId)
    console.log("[v0] Parameter data:", body)

    const parameterId = `param-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const { data: newParameter, error: insertError } = await supabase
      .from("analytics_parameters")
      .insert({
        id: parameterId,
        practice_id: practiceId,
        name: body.name,
        description: body.description,
        data_type: body.dataType,
        category: body.category || "",
        unit: body.unit,
        interval: body.interval,
        data_collection_start: body.dataCollectionStart,
        is_global: body.isGlobal || false,
        color: body.color,
        group_ids: body.groupIds,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating parameter:", insertError)
      return NextResponse.json(
        {
          error: "Failed to create parameter",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully created parameter:", newParameter?.id)

    return NextResponse.json({
      parameter: {
        id: newParameter?.id || parameterId,
        name: newParameter?.name || body.name,
        description: newParameter?.description || body.description,
        type: newParameter?.data_type || body.dataType,
        category: newParameter?.category || body.category,
        unit: newParameter?.unit || body.unit,
        interval: newParameter?.interval || body.interval,
        isGlobal: newParameter?.is_global || body.isGlobal || false,
        createdAt: newParameter?.created_at,
        updatedAt: newParameter?.updated_at,
        color: newParameter?.color,
        groupIds: newParameter?.group_ids,
        dataCollectionStart: newParameter?.data_collection_start,
        templateId: body.templateId, // Keep in response but don't save to DB
      },
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/practices/[practiceId]/parameters:", error)
    return NextResponse.json(
      {
        error: "Failed to create parameter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
