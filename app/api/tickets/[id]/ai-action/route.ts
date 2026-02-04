import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { title, description, type, priority, screenshots } = body

    // Generate AI action item text for V0 Chat
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `Du bist ein technischer Assistent, der Entwicklungsaufgaben für V0 (einen KI-gestützten Entwicklungsassistenten) formuliert. 
Erstelle präzise, strukturierte Anweisungen auf Deutsch, die V0 helfen, das Problem zu verstehen und zu lösen.

Formatiere die Ausgabe wie folgt:
1. Kurze Problembeschreibung
2. Kontext und betroffene Bereiche
3. Konkrete Lösungsanforderungen
4. Hinweise für die Implementierung

Halte die Anweisung professionell, klar und umsetzbar.`,
      prompt: `Erstelle eine Entwicklungsaufgabe für V0 Chat basierend auf diesem Ticket:

**Ticket-ID:** ${id}
**Titel:** ${title}
**Typ:** ${type === 'bug' ? 'Bug/Fehler' : type === 'feature' ? 'Feature-Anfrage' : type === 'improvement' ? 'Verbesserung' : type}
**Priorität:** ${priority === 'urgent' ? 'Dringend' : priority === 'high' ? 'Hoch' : priority === 'medium' ? 'Mittel' : 'Niedrig'}
**Beschreibung:** ${description || 'Keine detaillierte Beschreibung vorhanden'}
${screenshots?.length > 0 ? `**Screenshots:** ${screenshots.length} Screenshot(s) vorhanden` : ''}

Formuliere eine klare Aufgabe für V0, die das Problem löst.`,
    })

    return NextResponse.json({
      actionItem: text,
      ticketId: id,
    })
  } catch (error) {
    console.error("[v0] Error generating AI action item:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren der KI-Aktion" },
      { status: 500 }
    )
  }
}
