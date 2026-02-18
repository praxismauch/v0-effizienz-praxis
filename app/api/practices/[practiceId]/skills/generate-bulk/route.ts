import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { skills } = body

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: "Keine Kompetenzen zum Speichern" }, { status: 400 })
    }

    // Get the current max display_order for this practice
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("display_order")
      .eq("practice_id", practiceId)
      .order("display_order", { ascending: false })
      .limit(1)

    const startOrder = (existingSkills?.[0]?.display_order ?? -1) + 1

    const skillsToInsert = skills.map((skill: any, index: number) => ({
      practice_id: practiceId,
      name: skill.name,
      description: skill.description || null,
      category: skill.category || "other",
      is_active: true,
      display_order: startOrder + index,
      level_0_description: skill.level_0_description || null,
      level_1_description: skill.level_1_description || null,
      level_2_description: skill.level_2_description || null,
      level_3_description: skill.level_3_description || null,
    }))

    const { data, error } = await supabase
      .from("skills")
      .insert(skillsToInsert)
      .select()

    if (error) {
      console.error("Error bulk inserting skills:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ skills: data, count: data?.length || 0 })
  } catch (error) {
    console.error("Error in bulk skill save:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
