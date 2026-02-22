import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = hasSupabaseAdminConfig() ? await createAdminClient() : supabase
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use admin client for role lookup to bypass RLS
    const { data: userData } = await adminClient.from("users").select("role").eq("id", user.id).single()
    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { topic, category, tone, targetLength, keywords, action } = await request.json()

    // Action: suggest topics
    if (action === "suggest-topics") {
      const { data: existingPosts } = await adminClient
        .from("blog_posts")
        .select("title, category, tags")
        .order("created_at", { ascending: false })
        .limit(20)

      const existingTitles = existingPosts?.map((p) => p.title).join(", ") || "Keine"
      const existingCategories = [...new Set(existingPosts?.map((p) => p.category).filter(Boolean))].join(", ") || "Keine"

      const { text } = await generateText({
        model: "groq/llama-3.3-70b-versatile",
        prompt: `Du bist ein Content-Stratege für eine Praxismanagement-Software für Arztpraxen in Deutschland.

Bestehende Blog-Posts: ${existingTitles}
Bestehende Kategorien: ${existingCategories}

Generiere genau 8 frische, relevante Blog-Themen für die Zielgruppe "Ärzte und MFAs in deutschen Arztpraxen". 
Die Themen sollen sich auf Praxiseffizienz, Digitalisierung, QM, Teamführung, Patientenzufriedenheit und Best Practices fokussieren.
Vermeide Überschneidungen mit bestehenden Posts.

Antworte NUR als JSON-Array mit Objekten: [{"topic": "...", "category": "...", "description": "..."}]
Keine andere Ausgabe, kein Markdown, nur reines JSON.`,
      })

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
        return NextResponse.json({ suggestions })
      } catch {
        return NextResponse.json({ suggestions: [], raw: text })
      }
    }

    // Action: generate blog post
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const toneMap: Record<string, string> = {
      professional: "professionell und fachlich fundiert",
      informative: "informativ und leicht verständlich",
      practical: "praxisnah mit konkreten Tipps und Beispielen",
    }

    const lengthMap: Record<string, string> = {
      short: "ca. 500 Wörter",
      medium: "ca. 1000 Wörter",
      long: "ca. 2000 Wörter",
    }

    const toneInstruction = toneMap[tone] || toneMap.professional
    const lengthInstruction = lengthMap[targetLength] || lengthMap.medium
    const keywordInstruction = keywords?.length ? `\nIntegriere folgende Keywords natürlich: ${keywords.join(", ")}` : ""

    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: `Du bist ein erfahrener Fachautor für Praxismanagement und Gesundheitswesen in Deutschland.

AUFGABE: Schreibe einen hochwertigen Blog-Post zum Thema "${topic}".

STIL: ${toneInstruction}
LAENGE: ${lengthInstruction}
KATEGORIE: ${category || "Best Practices"}
${keywordInstruction}

ZIELGRUPPE: Ärzte, MFAs und Praxismanager in deutschen Arztpraxen.

ANFORDERUNGEN:
- Professioneller, einladender Titel
- Einleitung die das Problem/Thema skizziert
- Gut strukturierte Abschnitte mit Zwischenüberschriften (H2, H3)
- Konkrete, umsetzbare Tipps und Empfehlungen
- Praxisbeispiele wo sinnvoll
- Fazit mit Zusammenfassung der wichtigsten Punkte
- Kein generischer Content, sondern spezifisch für Arztpraxen

FORMAT: Antworte NUR als JSON-Objekt:
{
  "title": "Attraktiver, SEO-optimierter Titel",
  "excerpt": "Kurze Zusammenfassung in 2-3 Saetzen (max 200 Zeichen)",
  "content": "Der vollstaendige Blog-Post als HTML mit <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> Tags. Keine <h1> Tags.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_title": "SEO-optimierter Seitentitel (max 60 Zeichen)",
  "seo_description": "Meta-Description (max 155 Zeichen)"
}
Keine andere Ausgabe, kein Markdown, nur reines JSON.`,
    })

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: "AI did not return valid JSON", raw: text }, { status: 500 })
      }
      const generated = JSON.parse(jsonMatch[0])

      // Generate slug from title
      const slug = generated.title
        .toLowerCase()
        .replace(/[äöüß]/g, (m: string) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" })[m] || m)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80)

      return NextResponse.json({
        ...generated,
        slug,
        category: category || "Best Practices",
      })
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Blog generation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
