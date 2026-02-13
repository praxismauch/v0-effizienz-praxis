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

interface KPI {
  id: string
  name: string
  description?: string
}

interface Goal {
  title: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()

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
      selfCheckData,
    } = body

    if (!practiceId || practiceId === "null" || practiceId === "undefined") {
      return NextResponse.json({ error: "Keine Praxis zugeordnet. Bitte laden Sie die Seite neu." }, { status: 400 })
    }

    const effectivePeriodStart = periodStart || getWeekStart(new Date()).toISOString().split("T")[0]
    const effectivePeriodEnd = periodEnd || getWeekEnd(new Date()).toISOString().split("T")[0]

    const { data: existingJournals, error: checkError } = await supabase
      .from("practice_journals")
      .select("id, title, created_at")
      .eq("practice_id", practiceId)
      .eq("period_type", periodType)
      .eq("period_start", effectivePeriodStart)

    if (checkError) {
      console.error("Error checking for existing journal:", checkError)
    }

    if (existingJournals && existingJournals.length > 0) {
      const existing = existingJournals[0]
      return NextResponse.json(
        {
          error: `Ein Journal für diesen Zeitraum existiert bereits: "${existing.title}" (erstellt am ${new Date(existing.created_at).toLocaleDateString("de-DE")})`,
          existingJournalId: existing.id,
        },
        { status: 409 },
      )
    }

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
      (kpis as KPI[])?.map((k) => `- ${k.name}: ${k.description || "Keine Beschreibung"}`).join("\n") ||
      "Keine KPIs definiert"

    const valuesSummary =
      parameterValues?.length > 0 ? `${parameterValues.length} Datenpunkte erfasst` : "Keine Werte im Zeitraum erfasst"

    const teamSummary = teamMembers?.length > 0 ? `${teamMembers.length} Teammitglieder aktiv` : "Keine Teammitglieder"

    const goalsSummary =
      (goals as Goal[])?.length > 0
        ? (goals as Goal[]).map((g) => `- ${g.title}: ${g.status}`).join("\n")
        : "Keine Ziele definiert"

    const workflowsSummary =
      workflows?.length > 0 ? `${workflows.length} aktive Workflows implementiert` : "Keine Workflows definiert"

    const selfCheckSummary =
      selfCheckData
        ? `Selbst-Check durchgeführt:
- Energielevel: ${selfCheckData.energyLevel}/10
- Stresslevel: ${selfCheckData.stressLevel}/10
- Arbeitszufriedenheit: ${selfCheckData.jobSatisfaction}/10
- Team-Harmonie: ${selfCheckData.teamHarmony}/10
- Work-Life-Balance: ${selfCheckData.workLifeBalance}/10
- Gesamtbewertung: ${selfCheckData.overallScore}/10`
        : ""

    const prompt = `Du bist ein erfahrener Praxisberater für medizinische Praxen. Erstelle einen professionellen Praxis-Journalbericht für den Zeitraum ${effectivePeriodStart} bis ${effectivePeriodEnd}.

VERFÜGBARE DATEN:
- KPIs/Kennzahlen:
${kpiSummary}

- Datenpunkte: ${valuesSummary}
- Team: ${teamSummary}
- Workflows: ${workflowsSummary}
- Ziele:
${goalsSummary}

${selfCheckSummary ? `WOHLBEFINDEN & SELBSTEINSCHÄTZUNG:\n${selfCheckSummary}\n` : ""}
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
        kpis_included: (kpis as KPI[])?.map((k) => ({ id: k.id, name: k.name })) || [],
        user_notes: userNotes || null,
        status: "draft",
        generated_by: userId,
      })
      .select()
      .single()

    if (journalError) {
      console.error("Journal insert error:", journalError.message)
      if (journalError.code === "23505") {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate journal"
    console.error("Error generating journal:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
