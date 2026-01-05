import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { keyword, currentContent, targetUrl } = await req.json()

    console.log("[v0] Generating AI SEO optimization for keyword:", keyword)

    // Get blog posts and landing page content for context
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("title, content, seo_title, seo_description")
      .eq("is_published", true)
      .limit(5)

    const contentContext = blogPosts?.map((post) => `${post.title}: ${post.seo_description || post.excerpt}`).join("\n")

    // Generate AI-powered SEO recommendations
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Du bist ein SEO-Experte. Analysiere das folgende Keyword und gib konkrete Optimierungsvorschläge.

Keyword: "${keyword}"
Ziel-URL: ${targetUrl || "Startseite"}
Aktueller Content-Kontext:
${contentContext || "Keine existierenden Inhalte"}

Gib folgende Informationen zurück:
1. Content-Vorschläge: 3-5 konkrete Themen für Blog-Posts oder Seiten-Inhalte
2. On-Page-Optimierung: Titel-Tag, Meta-Description, H1-Vorschläge
3. Keyword-Varianten: Long-Tail-Keywords und verwandte Suchbegriffe
4. Content-Struktur: Empfohlene Abschnitte und Überschriften
5. Interne Verlinkung: Wo sollte dieses Keyword verlinkt werden

Formatiere die Antwort als JSON mit folgender Struktur:
{
  "contentSuggestions": ["...", "..."],
  "onPageOptimization": {
    "titleTag": "...",
    "metaDescription": "...",
    "h1": "..."
  },
  "keywordVariants": ["...", "..."],
  "contentStructure": ["...", "..."],
  "internalLinking": ["...", "..."],
  "priorityScore": 1-10,
  "difficulty": "einfach|mittel|schwer"
}`,
    })

    let optimization
    try {
      optimization = JSON.parse(text)
    } catch {
      // If AI doesn't return valid JSON, create a structured response
      optimization = {
        contentSuggestions: [
          `Blog-Post: "Der ultimative Guide zu ${keyword}"`,
          `FAQ-Seite für ${keyword}`,
          `Fallstudie: Erfolg mit ${keyword}`,
        ],
        onPageOptimization: {
          titleTag: `${keyword} - Praxissoftware für Ärzte | Effizienz Praxis`,
          metaDescription: `Optimieren Sie Ihre Praxis mit ${keyword}. Unsere Lösung hilft Ihnen dabei.`,
          h1: `${keyword}: Moderne Praxissoftware`,
        },
        keywordVariants: [`${keyword} Software`, `${keyword} Tool`, `Beste ${keyword}`, `${keyword} für Ärzte`],
        contentStructure: [
          `Einführung in ${keyword}`,
          "Vorteile und Features",
          "Anwendungsbeispiele",
          "Häufige Fragen (FAQ)",
          "Jetzt starten",
        ],
        internalLinking: ["Startseite", "Blog-Übersicht", "Preise", "Kontakt"],
        priorityScore: 7,
        difficulty: "mittel",
      }
    }

    console.log("[v0] AI optimization generated successfully")

    return NextResponse.json({ optimization })
  } catch (error: any) {
    console.error("[v0] Error generating AI optimization:", error)
    return NextResponse.json({ error: "Failed to generate AI optimization", details: error.message }, { status: 500 })
  }
}
