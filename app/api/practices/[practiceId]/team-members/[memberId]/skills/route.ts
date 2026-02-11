import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase not configured")
    _supabase = createClient(url, key)
  }
  return _supabase
}
const supabase = new Proxy({} as ReturnType<typeof createClient>, { get: (_, prop) => (getSupabase() as any)[prop] })

// GET - Fetch team member skills from team_members.skills array
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    // Fetch team member to get their skills array
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select("skills")
      .eq("id", memberId)
      .eq("practice_id", practiceId)
      .single()

    if (memberError || !teamMember) {
      console.error("Error fetching team member:", memberError)
      return NextResponse.json([])
    }

    // If the team member has skills in their skills array, transform them to the expected format
    const skillsArray = teamMember.skills || []
    
    if (skillsArray.length === 0) {
      return NextResponse.json([])
    }

    // Transform simple skill strings to skill objects
    const skills = skillsArray.map((skill: string, index: number) => ({
      id: `skill-${index}`,
      name: skill,
      category: "Allgemein",
      description: null,
      team_id: null,
      level_0_description: "Keine Erfahrung",
      level_1_description: "Grundkenntnisse",
      level_2_description: "Selbstständige Anwendung",
      level_3_description: "Experte",
      current_level: null,
      target_level: null,
      assessed_at: null,
      assessed_by: null,
      notes: null,
      team_member_skill_id: null,
    }))

    return NextResponse.json(skills)
  } catch (error) {
    console.error("Team member skills GET error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// POST - Add a skill to team member's skills array
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()
    const { skill_name } = body

    if (!skill_name) {
      return NextResponse.json({ error: "Skill name required" }, { status: 400 })
    }

    // Get current skills
    const { data: teamMember, error: fetchError } = await supabase
      .from("team_members")
      .select("skills")
      .eq("id", memberId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError) {
      console.error("Error fetching team member:", fetchError)
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    const currentSkills = teamMember?.skills || []
    
    // Add new skill if not already present
    if (!currentSkills.includes(skill_name)) {
      const { error: updateError } = await supabase
        .from("team_members")
        .update({ skills: [...currentSkills, skill_name] })
        .eq("id", memberId)
        .eq("practice_id", practiceId)

      if (updateError) {
        console.error("Error updating skills:", updateError)
        return NextResponse.json({ error: "Failed to add skill" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, skill: skill_name })
  } catch (error) {
    console.error("Team member skills POST error:", error)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
