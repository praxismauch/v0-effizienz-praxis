import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!connectionString) {
    throw new Error("Database connection string not configured")
  }
  return neon(connectionString)
}

export async function POST(request: NextRequest) {
  try {
    const sql = getDb() // Get connection inside handler
    const body = await request.json()
    const {
      ideaTitle,
      ideaDescription,
      ideaCategory,
      ideaPriority,
      ideaEffort,
      ideaImpact,
      feedbackType,
      feedbackReason,
      userId,
      practiceId,
      aiReasoning,
    } = body

    console.log("[v0] Saving roadmap idea feedback:", feedbackType, "for:", ideaTitle)

    const result = await sql`
      INSERT INTO roadmap_idea_feedback (
        idea_title,
        idea_description,
        idea_category,
        idea_priority,
        idea_effort,
        idea_impact,
        feedback_type,
        feedback_reason,
        user_id,
        practice_id,
        ai_reasoning
      ) VALUES (
        ${ideaTitle},
        ${ideaDescription},
        ${ideaCategory},
        ${ideaPriority},
        ${ideaEffort},
        ${ideaImpact},
        ${feedbackType},
        ${feedbackReason || null},
        ${userId || null},
        ${practiceId || null},
        ${aiReasoning || null}
      )
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("[v0] Error saving idea feedback:", error)
    return NextResponse.json(
      { error: "Failed to save feedback", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sql = getDb() // Get connection inside handler
    const { searchParams } = new URL(request.url)
    const feedbackType = searchParams.get("type")

    let query
    if (feedbackType) {
      query = sql`
        SELECT * FROM roadmap_idea_feedback
        WHERE feedback_type = ${feedbackType}
        ORDER BY created_at DESC
        LIMIT 100
      `
    } else {
      query = sql`
        SELECT * FROM roadmap_idea_feedback
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    const feedback = await query

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("[v0] Error fetching idea feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}
