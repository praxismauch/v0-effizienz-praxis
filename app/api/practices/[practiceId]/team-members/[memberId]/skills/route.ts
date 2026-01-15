import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params

    if (!practiceId || practiceId === "0" || !memberId) {
      return NextResponse.json([])
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

    // Get all skills for the practice with their definitions
    const { data: skills, error: skillsError } = await supabase
      .from("skill_definitions")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("category")
      .order("display_order")

    if (skillsError) {
      console.error("Team member skills - skills error:", skillsError)
      return NextResponse.json({ error: skillsError.message }, { status: 500 })
    }

    // Get the team member's skill assessments
    const { data: memberSkills, error: memberSkillsError } = await supabase
      .from("team_member_skills")
      .select("*")
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (memberSkillsError) {
      console.error("Team member skills - member skills error:", memberSkillsError)
      return NextResponse.json({ error: memberSkillsError.message }, { status: 500 })
    }

    // Merge skills with member assessments
    const skillsWithAssessments = (skills || []).map((skill) => {
      const assessment = (memberSkills || []).find((ms) => ms.skill_id === skill.id)
      return {
        ...skill,
        current_level: assessment?.current_level ?? null,
        target_level: assessment?.target_level ?? null,
        assessed_at: assessment?.assessed_at ?? null,
        assessed_by: assessment?.assessed_by ?? null,
        notes: assessment?.notes ?? null,
        team_member_skill_id: assessment?.id ?? null,
      }
    })

    return NextResponse.json(skillsWithAssessments)
  } catch (error) {
    console.error("Team member skills GET error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Fehler beim Laden der Skills" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()

    if (!practiceId || !memberId || !body.skill_id) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    // Check if assessment exists
    const { data: existing } = await supabase
      .from("team_member_skills")
      .select("id, current_level")
      .eq("team_member_id", memberId)
      .eq("skill_id", body.skill_id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    const previousLevel = existing?.current_level

    const { data: latestHistory } = await supabase
      .from("team_member_skills_history")
      .select("version")
      .eq("team_member_id", memberId)
      .eq("skill_id", body.skill_id)
      .eq("practice_id", practiceId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latestHistory?.version || 0) + 1

    if (existing) {
      // Update existing assessment
      const { data, error } = await supabase
        .from("team_member_skills")
        .update({
          current_level: body.current_level,
          target_level: body.target_level,
          assessed_by: body.assessed_by,
          assessed_at: new Date().toISOString(),
          notes: body.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        console.error("Update team member skill error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from("team_member_skills_history").insert({
        id: crypto.randomUUID(),
        team_member_skill_id: existing.id,
        team_member_id: memberId,
        skill_id: body.skill_id,
        practice_id: practiceId,
        level: body.current_level,
        version: nextVersion,
        assessed_by: body.assessed_by,
        change_reason:
          body.change_reason ||
          (previousLevel !== body.current_level ? "Level aktualisiert" : "Bewertung aktualisiert"),
        notes: body.notes,
        changed_at: new Date().toISOString(),
      })

      return NextResponse.json({ ...data, version: nextVersion })
    } else {
      // Create new assessment
      const newId = crypto.randomUUID()
      const { data, error } = await supabase
        .from("team_member_skills")
        .insert({
          id: newId,
          team_member_id: memberId,
          skill_id: body.skill_id,
          practice_id: practiceId,
          current_level: body.current_level,
          target_level: body.target_level,
          assessed_by: body.assessed_by,
          assessed_at: new Date().toISOString(),
          notes: body.notes,
        })
        .select()
        .single()

      if (error) {
        console.error("Create team member skill error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from("team_member_skills_history").insert({
        id: crypto.randomUUID(),
        team_member_skill_id: newId,
        team_member_id: memberId,
        skill_id: body.skill_id,
        practice_id: practiceId,
        level: body.current_level,
        version: 1,
        assessed_by: body.assessed_by,
        change_reason: "Erste Bewertung",
        notes: body.notes,
        changed_at: new Date().toISOString(),
      })

      return NextResponse.json({ ...data, version: 1 })
    }
  } catch (error) {
    console.error("Team member skills POST error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
