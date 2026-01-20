import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch team member skills
// TODO: Skills tables don't exist in database yet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    // Temporary: Return empty array until skills tables are created
    return NextResponse.json([])
  } catch (error) {
    console.error("Team member skills GET error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// POST - Create or update team member skill assessment
// TODO: Skills feature not yet implemented
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    return NextResponse.json(
      { error: "Skills feature coming soon - database tables not yet created" },
      { status: 501 }
    )
  } catch (error) {
    console.error("Team member skills POST error:", error)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
