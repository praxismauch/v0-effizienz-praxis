import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const body = await request.json()
    const { schedules, team_members, violations, availability } = body

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Analysiere diesen Dienstplan einer deutschen Arztpraxis und gib 2-3 kurze, konkrete Verbesserungsvorschläge auf Deutsch:

Schichten diese Woche: ${schedules.length}
Team-Größe: ${team_members.length}
Offene Compliance-Probleme: ${violations.filter((v: any) => !v.resolved).length}
Eingetragene Verfügbarkeiten: ${availability.length}

Fokussiere auf:
1. Optimierung der Arbeitsverteilung
2. Faire Wochenend-Verteilung
3. Compliance mit Arbeitszeitgesetz

Antworte in 2-3 kurzen Sätzen mit konkreten Empfehlungen.`,
    })

    return NextResponse.json({ insights: text })
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json({ insights: "" })
  }
}
