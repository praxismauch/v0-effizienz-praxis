import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { query, practiceId } = await request.json()

    if (!query || !practiceId) {
      return NextResponse.json({ error: "Query and practice ID are required" }, { status: 400 })
    }

    // Fetch all knowledge base articles for the practice
    const { data: articles, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("status", "published")

    if (error) {
      console.error("[v0] Error fetching articles for AI search:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Instead, use simple text search and return relevant articles
    const { data: searchResults } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("status", "published")
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "german",
      })
      .limit(5)

    // Generate a simple response based on search results
    let answer = ""
    if (searchResults && searchResults.length > 0) {
      answer = `Ich habe ${searchResults.length} relevante Artikel gefunden:\n\n`
      searchResults.forEach((article, index) => {
        answer += `${index + 1}. ${article.title} (${article.category})\n`
      })
    } else {
      answer = "Leider konnte ich keine passenden Artikel zu Ihrer Anfrage finden."
    }

    return NextResponse.json({
      answer,
      relevantArticles: searchResults || [],
    })
  } catch (error) {
    console.error("[v0] Error in AI search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
