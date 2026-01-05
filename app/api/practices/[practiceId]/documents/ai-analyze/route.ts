import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createClient()
    const practiceId = params.practiceId

    // Fetch documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_archived", false)

    const { text } = await generateText({
      model: "openai/gpt-4o", // Upgraded from gpt-4o-mini to gpt-4o for better document analysis
      prompt: `Analysiere die Dokumentenstruktur einer Arztpraxis und gib Organisationsempfehlungen:

Dokumente: ${JSON.stringify(documents?.map((d) => ({ name: d.name, folder: d.folder, tags: d.tags })))}

Gib die Antwort als JSON:
{
  "organizationScore": 75,
  "organizationSummary": "Kurze Bewertung",
  "suggestedFolders": ["Ordner 1", "Ordner 2", "Ordner 3"],
  "taggingSuggestions": [
    { "document": "Dokument-Name", "tags": ["Tag1", "Tag2"] }
  ],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"]
}`,
    })

    const analysis = JSON.parse(text)
    return Response.json(analysis)
  } catch (error) {
    console.error("Error analyzing documents:", error)
    return Response.json({ error: "Failed to analyze documents" }, { status: 500 })
  }
}
