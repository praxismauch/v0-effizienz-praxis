import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { week_start, team_members, shift_types, availability, existing_schedules } = body

    // Generate AI schedule suggestions
    const prompt = `Du bist ein KI-Assistent für Dienstplanung in einer deutschen Arztpraxis.

Erstelle einen optimierten Wochenplan für die Woche ab ${week_start}.

Team-Mitglieder:
${JSON.stringify(team_members, null, 2)}

Verfügbare Schichttypen:
${JSON.stringify(shift_types, null, 2)}

Verfügbarkeiten:
${JSON.stringify(availability, null, 2)}

Bestehende Schichten (nicht ändern):
${JSON.stringify(existing_schedules, null, 2)}

Regeln:
1. Beachte Arbeitszeitgesetz (max. 10h/Tag, 48h/Woche, 11h Ruhezeit zwischen Schichten)
2. Verteile Wochenend- und Spätdienste fair
3. Berücksichtige individuelle Verfügbarkeiten
4. Stelle Mindestbesetzung sicher
5. Beachte Teilzeit-Verträge

Antworte NUR mit einem JSON-Array von Schicht-Vorschlägen im Format:
[
  {
    "team_member_id": "...",
    "shift_type_id": "...",
    "shift_date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "reason": "Kurze Begründung"
  }
]`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    // Parse AI response
    let suggestions = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
    }

    // Save suggestions to database
    if (suggestions.length > 0) {
      await supabase.from("schedule_suggestions").insert({
        practice_id: practiceId,
        week_start,
        suggestion_data: suggestions,
        score: 85.0, // Placeholder score
        considerations: {
          team_size: team_members.length,
          shift_types: shift_types.length,
          rules_applied: ["arbeitszeitgesetz", "fair_distribution", "availability"],
        },
        status: "pending",
      })

      // Optionally auto-apply suggestions
      for (const suggestion of suggestions) {
        await supabase.from("shift_schedules").insert({
          practice_id: practiceId,
          team_member_id: suggestion.team_member_id,
          shift_type_id: suggestion.shift_type_id,
          shift_date: suggestion.shift_date,
          start_time: suggestion.start_time,
          end_time: suggestion.end_time,
          status: "scheduled",
          notes: `KI-generiert: ${suggestion.reason}`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      message: `${suggestions.length} Schichten wurden generiert.`,
    })
  } catch (error) {
    console.error("Error generating AI schedule:", error)
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 })
  }
}
