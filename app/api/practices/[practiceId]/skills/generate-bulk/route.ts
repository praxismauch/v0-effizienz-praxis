import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
    }

    const { keywords, practiceType, teamId, teamName, count = 15, existingSkillNames = [] } = body

    if (!practiceId || practiceId === "0" || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID erforderlich" }, { status: 400 })
    }

    if (!keywords || keywords.trim().length === 0) {
      return NextResponse.json({ error: "Bitte geben Sie Stichworte oder Beschreibungen ein" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get practice info for context
    const { data: practice } = await supabase.from("practices").select("name, specialty").eq("id", practiceId).single()

    const practiceContext = practice?.specialty || practiceType || "Arztpraxis"
    const teamContext = teamName ? `für das Team "${teamName}"` : "für die gesamte Praxis"

    const prompt = `Du bist ein Experte für Kompetenzmanagement in medizinischen Praxen.

Generiere ${count} professionelle Skills/Kompetenzen für eine ${practiceContext} ${teamContext}.

Benutzer-Input/Stichworte: "${keywords}"

Bereits vorhandene Skills (NICHT erneut generieren): ${existingSkillNames.length > 0 ? existingSkillNames.join(", ") : "keine"}

Für jeden Skill erstelle:
1. name: Kurzer, prägnanter Name (max. 50 Zeichen)
2. category: Eine Kategorie aus: medical, administrative, communication, technical, soft_skills, quality, hygiene, emergency
3. description: Kurze Beschreibung (1-2 Sätze)
4. level_0_description: Level 0 - Keine Erfahrung (was kann die Person NICHT)
5. level_1_description: Level 1 - Grundkenntnisse (was kann die Person mit Anleitung)
6. level_2_description: Level 2 - Fortgeschritten (was kann die Person selbstständig)
7. level_3_description: Level 3 - Experte (was kann die Person zusätzlich, z.B. andere anleiten)

Die Skills sollen:
- Spezifisch für den medizinischen Bereich sein
- Messbar und beobachtbar sein
- Unterschiedliche Schwierigkeitsstufen abdecken
- Praxisrelevant sein

Antworte NUR mit einem validen JSON-Array ohne zusätzlichen Text:
[
  {
    "name": "Skill Name",
    "category": "medical",
    "description": "Beschreibung des Skills",
    "level_0_description": "Keine Erfahrung mit...",
    "level_1_description": "Kann mit Anleitung...",
    "level_2_description": "Kann selbstständig...",
    "level_3_description": "Kann andere anleiten in..."
  }
]`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      temperature: 0.7,
    })

    // Parse the response
    let skills: any[] = []
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        skills = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON array found in response")
      }
    } catch (parseError) {
      console.error("Skills generation parse error:", parseError)
      return NextResponse.json(
        {
          error: "Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.",
        },
        { status: 500 },
      )
    }

    // Validate and clean skills
    const validatedSkills = skills
      .filter((skill) => skill.name && skill.category)
      .map((skill) => ({
        name: skill.name.substring(0, 100),
        category: skill.category,
        description: skill.description || "",
        level_0_description: skill.level_0_description || "Keine Erfahrung",
        level_1_description: skill.level_1_description || "Grundkenntnisse",
        level_2_description: skill.level_2_description || "Fortgeschritten",
        level_3_description: skill.level_3_description || "Experte",
        team_id: teamId || null,
        practice_id: practiceId,
        is_active: true,
      }))

    return NextResponse.json({
      skills: validatedSkills,
      count: validatedSkills.length,
    })
  } catch (error: any) {
    console.error("Skills bulk generation error:", error)
    return NextResponse.json(
      {
        error: error?.message?.includes("API")
          ? "KI-Service vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."
          : "Fehler bei der KI-Generierung. Bitte versuchen Sie es erneut.",
      },
      { status: 500 },
    )
  }
}
