import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { transcript, meetingTitle, speakers } = await req.json()

    console.log("[v0] Protocol generation request received", {
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length,
      meetingTitle,
      speakersCount: speakers?.length,
    })

    if (!transcript || transcript.trim().length === 0) {
      console.log("[v0] No valid transcript provided")
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
    }

    console.log("[v0] Generating protocol with GPT-4")

    const speakerList = speakers && speakers.length > 0 ? `Teilnehmer: ${speakers.join(", ")}` : ""

    const { text: protocol } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "system",
          content: `Du bist ein Assistent, der professionelle Meeting-Protokolle erstellt. 
Strukturiere das Protokoll mit folgenden Abschnitten:
- Datum und Uhrzeit
- Teilnehmer
- Themen und Diskussionspunkte
- Entscheidungen und Beschlüsse
- Offene Punkte und To-dos
- Nächste Schritte

Formatiere das Protokoll klar und übersichtlich mit Markdown.`,
        },
        {
          role: "user",
          content: `Erstelle ein strukturiertes Protokoll aus folgender Transkription:

${meetingTitle ? `Titel: ${meetingTitle}` : ""}
${speakerList}

Transkription:
${transcript}`,
        },
      ],
      temperature: 0.7,
    })

    console.log("[v0] Protocol generated successfully", {
      protocolLength: protocol.length,
    })

    return NextResponse.json({ protocol })
  } catch (error) {
    console.error("[v0] Protocol generation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to generate protocol", details: errorMessage }, { status: 500 })
  }
}
