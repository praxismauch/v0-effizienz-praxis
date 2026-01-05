import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export const dynamic = "force-dynamic"

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Practice journal generation started")
    const supabase = await createAdminClient()

    const body = await request.json()
    console.log("[v0] Request body received:", { hasPracticeId: !!body.practiceId, practiceId: body.practiceId })

    const {
      practiceId,
      periodType = "weekly",
      periodStart,
      periodEnd,
      userNotes,
      kpis,
      parameterValues,
      teamMembers,
      goals,
      workflows,
    } = body

    if (!practiceId || practiceId === "null" || practiceId === "undefined") {
      console.error("[v0] Missing or invalid practiceId:", practiceId)
      return NextResponse.json({ error: "Keine Praxis zugeordnet. Bitte laden Sie die Seite neu." }, { status: 400 })
    }

    const effectivePeriodStart = periodStart || getWeekStart(new Date()).toISOString().split("T")[0]
    const effectivePeriodEnd = periodEnd || getWeekEnd(new Date()).toISOString().split("T")[0]

    console.log("[v0] Checking for existing journal:", { practiceId, periodType, effectivePeriodStart })

    const { data: existingJournals, error: checkError } = await supabase
      .from("practice_journals")
      .select("id, title, created_at")
      .eq("practice_id", practiceId)
      .eq("period_type", periodType)
      .eq("period_start", effectivePeriodStart)

    if (checkError) {
      console.error("[v0] Error checking for existing journal:", checkError)
    }

    if (existingJournals && existingJournals.length > 0) {
      const existing = existingJournals[0]
      console.log("[v0] Found existing journal:", existing.id)
      return NextResponse.json(
        {
          error: `Ein Journal für diesen Zeitraum existiert bereits: "${existing.title}" (erstellt am ${new Date(existing.created_at).toLocaleDateString("de-DE")})`,
          existingJournalId: existing.id,
        },
        { status: 409 },
      )
    }

    console.log("[v0] No existing journal found, proceeding with generation")

    // Get auth user
    const authHeader = request.headers.get("authorization")
    let userId = null

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const {
        data: { user },
      } = await supabase.auth.getUser(token)
      userId = user?.id
    }

    // Build context for AI
    const kpiSummary =
      kpis?.map((k: any) => `- ${k.name}: ${k.description || "Keine Beschreibung"}`).join("\n") ||
      "Keine KPIs definiert"

    const valuesSummary =
      parameterValues?.length > 0 ? `${parameterValues.length} Datenpunkte erfasst` : "Keine Werte im Zeitraum erfasst"

    const teamSummary = teamMembers?.length > 0 ? `${teamMembers.length} Teammitglieder aktiv` : "Keine Teammitglieder"

    const goalsSummary =
      goals?.length > 0 ? goals.map((g: any) => `- ${g.title}: ${g.status}`).join("\n") : "Keine Ziele definiert"

    const prompt = `Du bist ein erfahrener Praxisberater für medizinische Praxen. Erstelle einen professionellen Praxis-Journalbericht für den Zeitraum ${effectivePeriodStart} bis ${effectivePeriodEnd}.

VERFÜGBARE DATEN:
- KPIs/Kennzahlen:
${kpiSummary}

- Datenpunkte: ${valuesSummary}
- Team: ${teamSummary}
- Ziele:
${goalsSummary}

${userNotes ? `NOTIZEN DES PRAXISMANAGERS:\n${userNotes}` : ""}

Erstelle einen strukturierten Bericht mit:
1. ZUSAMMENFASSUNG (2-3 Sätze Gesamtüberblick)
2. ERFOLGE (3-5 positive Entwicklungen)
3. HERAUSFORDERUNGEN (2-4 Bereiche mit Verbesserungspotential)
4. EMPFEHLUNGEN (4-6 konkrete Handlungsempfehlungen)

Antworte im JSON-Format:
{
  "summary": "Gesamtzusammenfassung...",
  "overview": "Detaillierte Übersicht...",
  "achievements": ["Erfolg 1", "Erfolg 2", ...],
  "challenges": ["Herausforderung 1", ...],
  "recommendations": ["Empfehlung 1", ...]
}

Sei konkret, konstruktiv und praxisnah. Verwende deutsche Sprache.`

    // Generate AI analysis
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    // Parse AI response
    let aiAnalysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0])
      } else {
        aiAnalysis = {
          summary: text.substring(0, 500),
          overview: text,
          achievements: [],
          challenges: [],
          recommendations: [],
        }
      }
    } catch {
      aiAnalysis = {
        summary: text.substring(0, 500),
        overview: text,
        achievements: [],
        challenges: [],
        recommendations: [],
      }
    }

    // Create journal title
    const periodLabel =
      periodType === "monthly"
        ? "Monatsbericht"
        : periodType === "quarterly"
          ? "Quartalsbericht"
          : periodType === "yearly"
            ? "Jahresbericht"
            : "Wochenbericht"
    const title = `${periodLabel} ${new Date(effectivePeriodStart).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`

    console.log("[v0] Creating journal with practice_id:", practiceId)

    // Save journal
    const { data: journal, error: journalError } = await supabase
      .from("practice_journals")
      .insert({
        practice_id: practiceId,
        period_type: periodType,
        period_start: effectivePeriodStart,
        period_end: effectivePeriodEnd,
        title,
        summary: aiAnalysis.summary,
        ai_analysis: aiAnalysis,
        kpis_included: kpis?.map((k: any) => ({ id: k.id, name: k.name })) || [],
        user_notes: userNotes || null,
        status: "draft",
        generated_by: userId,
      })
      .select()
      .single()

    if (journalError) {
      console.error("[v0] Journal insert error:", journalError.message)
      if (journalError.code === "23505") {
        // Fetch the existing journal to return its ID
        const { data: existing } = await supabase
          .from("practice_journals")
          .select("id, title, created_at")
          .eq("practice_id", practiceId)
          .eq("period_type", periodType)
          .eq("period_start", effectivePeriodStart)
          .single()

        if (existing) {
          return NextResponse.json(
            {
              error: `Ein Journal für diesen Zeitraum existiert bereits: "${existing.title}"`,
              existingJournalId: existing.id,
            },
            { status: 409 },
          )
        }
      }
      throw journalError
    }

    console.log("[v0] Journal created successfully:", journal.id)

    // Create action items from recommendations
    if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
      const actionItems = aiAnalysis.recommendations.map((rec: string, index: number) => ({
        journal_id: journal.id,
        title: rec.length > 100 ? rec.substring(0, 97) + "..." : rec,
        description: rec,
        priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
        category: "recommendation",
        status: "pending",
        ai_generated: true,
      }))

      await supabase.from("journal_action_items").insert(actionItems)
    }

    return NextResponse.json({ success: true, journal })
  } catch (error: any) {
    console.error("[v0] Error generating journal:", error)
    return NextResponse.json({ error: error.message || "Failed to generate journal" }, { status: 500 })
  }
}
