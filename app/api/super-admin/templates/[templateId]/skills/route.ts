import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

    const { data, error } = await supabase
      .from("template_skills")
      .select("*")
      .eq("template_id", templateId)
      .is("deleted_at", null)
      .order("category", { ascending: true })
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Template skills GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Template skills GET error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Skills" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params
    const body = await request.json()

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    // Handle bulk insert for AI-generated skills
    if (Array.isArray(body.skills)) {
      const skillsToInsert = body.skills.map((skill: any, index: number) => ({
        template_id: templateId,
        name: skill.name,
        category: skill.category || null,
        description: skill.description || null,
        color: skill.color || "#3b82f6",
        icon: skill.icon || "star",
        level_0_title: skill.level_0_title || "Kein Skill",
        level_0_description: skill.level_0_description || "Keine Erfahrung, benötigt vollständige Anleitung",
        level_0_criteria: skill.level_0_criteria || [],
        level_1_title: skill.level_1_title || "Basis",
        level_1_description: skill.level_1_description || "Kann einfache Aufgaben mit Anleitung ausführen",
        level_1_criteria: skill.level_1_criteria || [],
        level_2_title: skill.level_2_title || "Selbstständig",
        level_2_description: skill.level_2_description || "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
        level_2_criteria: skill.level_2_criteria || [],
        level_3_title: skill.level_3_title || "Experte",
        level_3_description:
          skill.level_3_description || "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
        level_3_criteria: skill.level_3_criteria || [],
        is_active: skill.is_active ?? true,
        display_order: skill.display_order ?? index,
      }))

      const { data, error } = await supabase.from("template_skills").insert(skillsToInsert).select()

      if (error) {
        console.error("[v0] Template skills bulk POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Single skill insert
    const { data, error } = await supabase
      .from("template_skills")
      .insert({
        template_id: templateId,
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        color: body.color || "#3b82f6",
        icon: body.icon || "star",
        level_0_title: body.level_0_title || "Kein Skill",
        level_0_description: body.level_0_description || "Keine Erfahrung, benötigt vollständige Anleitung",
        level_0_criteria: body.level_0_criteria || [],
        level_1_title: body.level_1_title || "Basis",
        level_1_description: body.level_1_description || "Kann einfache Aufgaben mit Anleitung ausführen",
        level_1_criteria: body.level_1_criteria || [],
        level_2_title: body.level_2_title || "Selbstständig",
        level_2_description: body.level_2_description || "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
        level_2_criteria: body.level_2_criteria || [],
        level_3_title: body.level_3_title || "Experte",
        level_3_description:
          body.level_3_description || "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
        level_3_criteria: body.level_3_criteria || [],
        is_active: body.is_active ?? true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Template skill POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Template skill POST error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen des Skills" }, { status: 500 })
  }
}
