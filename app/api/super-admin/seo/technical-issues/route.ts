import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Fetch blog posts to check for SEO issues
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("id, title, slug, seo_title, seo_description, image_url")
      .eq("is_published", true)

    const issues: Array<{
      type: string
      severity: "low" | "medium" | "high"
      page: string
      issue: string
      recommendation: string
    }> = []

    blogPosts?.forEach((post) => {
      const path = `/blog/${post.slug}`

      // Check for missing meta descriptions
      if (!post.seo_description || post.seo_description.length < 50) {
        issues.push({
          type: "Meta Description",
          severity: "medium",
          page: path,
          issue: "Fehlende oder zu kurze Meta-Beschreibung",
          recommendation: "Meta-Beschreibung mit 150-160 Zeichen hinzufügen",
        })
      }

      // Check for missing or duplicate titles
      if (!post.seo_title || post.seo_title === post.title) {
        issues.push({
          type: "Title Tag",
          severity: "low",
          page: path,
          issue: "Fehlender oder duplizierter SEO-Titel",
          recommendation: "Einzigartigen SEO-Titel mit Keyword hinzufügen",
        })
      }

      // Check for missing images
      if (!post.image_url) {
        issues.push({
          type: "Bild",
          severity: "low",
          page: path,
          issue: "Fehlendes Vorschaubild",
          recommendation: "Featured Image für bessere Social Shares hinzufügen",
        })
      }
    })

    // Sort by severity (high > medium > low)
    const severityOrder = { high: 3, medium: 2, low: 1 }
    issues.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])

    return NextResponse.json({ issues: issues.slice(0, 20) })
  } catch (error) {
    console.error("Error fetching technical issues:", error)
    return NextResponse.json({ error: "Failed to fetch technical issues" }, { status: 500 })
  }
}
