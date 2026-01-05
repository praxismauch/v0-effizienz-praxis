import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/api/rate-limit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const rateLimitResult = await checkRateLimit(`perma-assessments-get-${practiceId}`, 30, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warten Sie einen Moment.", rateLimited: true },
        { status: 429 },
      )
    }

    const supabase = await createAdminClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    let query = supabase
      .from("perma_assessments")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("assessment_date", { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching PERMA assessments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the latest assessment for calculating averages
    const latestAssessment = data?.[0]

    // Calculate practice-wide averages
    const { data: avgData } = await supabase
      .from("perma_assessments")
      .select("positive_emotions, engagement, relationships, meaning, accomplishment, vitality")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("assessment_date", { ascending: false })
      .limit(50)

    let practiceAverages = null
    if (avgData && avgData.length > 0) {
      practiceAverages = {
        positiveEmotions: Math.round(avgData.reduce((sum, a) => sum + a.positive_emotions, 0) / avgData.length),
        engagement: Math.round(avgData.reduce((sum, a) => sum + a.engagement, 0) / avgData.length),
        relationships: Math.round(avgData.reduce((sum, a) => sum + a.relationships, 0) / avgData.length),
        meaning: Math.round(avgData.reduce((sum, a) => sum + a.meaning, 0) / avgData.length),
        accomplishment: Math.round(avgData.reduce((sum, a) => sum + a.accomplishment, 0) / avgData.length),
        vitality: Math.round(avgData.reduce((sum, a) => sum + a.vitality, 0) / avgData.length),
      }
    }

    return NextResponse.json({
      assessments: data,
      latestAssessment,
      practiceAverages,
    })
  } catch (error) {
    console.error("Error in PERMA assessments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const {
      userId,
      positiveEmotions,
      engagement,
      relationships,
      meaning,
      accomplishment,
      vitality,
      assessmentType = "self",
      notes,
      actionItems = [],
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate scores are between 0-100
    const scores = { positiveEmotions, engagement, relationships, meaning, accomplishment, vitality }
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== "number" || value < 0 || value > 100) {
        return NextResponse.json({ error: `Invalid score for ${key}: must be 0-100` }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from("perma_assessments")
      .insert({
        practice_id: practiceId,
        user_id: userId,
        positive_emotions: positiveEmotions,
        engagement,
        relationships,
        meaning,
        accomplishment,
        vitality,
        assessment_type: assessmentType,
        notes,
        action_items: actionItems,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating PERMA assessment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PERMA assessments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { id, positiveEmotions, engagement, relationships, meaning, accomplishment, vitality, notes, actionItems } =
      body

    if (!id) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (positiveEmotions !== undefined) updateData.positive_emotions = positiveEmotions
    if (engagement !== undefined) updateData.engagement = engagement
    if (relationships !== undefined) updateData.relationships = relationships
    if (meaning !== undefined) updateData.meaning = meaning
    if (accomplishment !== undefined) updateData.accomplishment = accomplishment
    if (vitality !== undefined) updateData.vitality = vitality
    if (notes !== undefined) updateData.notes = notes
    if (actionItems !== undefined) updateData.action_items = actionItems

    const { data, error } = await supabase
      .from("perma_assessments")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating PERMA assessment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PERMA assessments PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
