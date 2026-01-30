import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Du bist ein Assistent für medizinische Praxen, der hilft, Dashboard-Widgets zu erstellen.

Basierend auf dieser Beschreibung: "${prompt}"

Erstelle eine Widget-Konfiguration im folgenden JSON-Format:
{
  "title": "Kurzer, prägnanter Titel",
  "description": "Detaillierte Beschreibung was das Widget zeigt",
  "type": "chart|stat|table|custom",
  "chartType": "bar|line|pie|area|radar (nur wenn type=chart)",
  "category": "overview|financial|patients|operations|team"
}

Wähle den besten Widget-Typ und die beste Darstellungsform für die Anfrage. Antworte NUR mit dem JSON, ohne zusätzlichen Text.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const widgetConfig = JSON.parse(jsonMatch[0])

    return NextResponse.json(widgetConfig)
  } catch (error) {
    console.error("[v0] Error generating widget:", error)
    return NextResponse.json({ error: "Failed to generate widget" }, { status: 500 })
  }
}
