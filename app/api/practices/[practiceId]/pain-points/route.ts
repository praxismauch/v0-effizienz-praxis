import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface PainPoint {
  id: string
  title: string
  description: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { painPoints, createGoals = true } = (await request.json()) as {
      painPoints: PainPoint[]
      createGoals?: boolean
    }

    if (!painPoints || !Array.isArray(painPoints)) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Get current practice settings
    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("settings")
      .eq("id", practiceId)
      .single()

    if (practiceError) {
      console.error("Error fetching practice:", practiceError)
      return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
    }

    // Filter valid pain points (with title)
    const validPainPoints = painPoints.filter((p) => p.title.trim())

    // Update settings with pain points
    const currentSettings = practice?.settings || {}
    const updatedSettings = {
      ...currentSettings,
      painPoints: validPainPoints.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        createdAt: new Date().toISOString(),
      })),
      painPointsUpdatedAt: new Date().toISOString(),
    }

    const { error: updateError } = await adminClient
      .from("practices")
      .update({ settings: updatedSettings })
      .eq("id", practiceId)

    if (updateError) {
      console.error("Error updating practice:", updateError)
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
    }

    const createdGoals: Array<{ id: string; title: string }> = []

    if (createGoals && validPainPoints.length > 0) {
      // Calculate end date (6 months from now)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6)
      const endDateStr = endDate.toISOString().split("T")[0]

      for (const painPoint of validPainPoints) {
        // Create a goal from the pain point
        const goalData = {
          practice_id: practiceId,
          created_by: user.id,
          assigned_to: null,
          title: `${painPoint.title} lösen`,
          description: painPoint.description || `Aus Onboarding: ${painPoint.title}`,
          goal_type: "practice",
          status: "not-started",
          priority: "high",
          start_date: new Date().toISOString().split("T")[0],
          end_date: endDateStr,
          is_private: false,
          metadata: {
            source: "onboarding_pain_point",
            pain_point_id: painPoint.id,
            pain_point_title: painPoint.title,
          },
          show_on_dashboard: true,
        }

        const { data: goal, error: goalError } = await adminClient
          .from("goals")
          .insert(goalData)
          .select("id, title")
          .single()

        if (goalError) {
          console.error("Error creating goal from pain point:", goalError)
          // Continue with other goals even if one fails
        } else if (goal) {
          createdGoals.push(goal)
        }
      }
    }

    return NextResponse.json({
      success: true,
      painPointsSaved: validPainPoints.length,
      goalsCreated: createdGoals.length,
      goals: createdGoals,
    })
  } catch (error) {
    console.error("Error saving pain points:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("settings")
      .eq("id", practiceId)
      .single()

    if (practiceError) {
      return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
    }

    const painPoints = practice?.settings?.painPoints || []

    const { data: relatedGoals } = await adminClient
      .from("goals")
      .select("id, title, status, progress_percentage")
      .eq("practice_id", practiceId)
      .contains("metadata", { source: "onboarding_pain_point" })
      .is("deleted_at", null)

    return NextResponse.json({
      painPoints,
      relatedGoals: relatedGoals || [],
    })
  } catch (error) {
    console.error("Error fetching pain points:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
