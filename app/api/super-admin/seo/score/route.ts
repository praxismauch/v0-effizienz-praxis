import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // 1. Get technical issues (max 20 points - fewer issues = higher score)
    const { data: issues } = await supabase.from("seo_keywords").select("*").eq("status", "error")

    const issueCount = issues?.length || 0
    const technicalScore = Math.max(0, 20 - issueCount * 2) // Deduct 2 points per issue

    // 2. Get keyword performance (max 30 points)
    const { data: keywords } = await supabase
      .from("seo_keywords")
      .select("current_position, target_position, priority")
      .limit(50)

    let keywordScore = 0
    if (keywords && keywords.length > 0) {
      const topRankedKeywords = keywords.filter((k) => k.current_position && k.current_position <= 10).length
      const totalKeywords = keywords.length
      const avgPositionImprovement =
        keywords
          .filter((k) => k.current_position && k.target_position)
          .reduce((acc, k) => {
            const improvement = Math.max(0, (k.target_position || 100) - (k.current_position || 100))
            return acc + improvement
          }, 0) / Math.max(1, keywords.length)

      keywordScore = Math.min(30, (topRankedKeywords / totalKeywords) * 20 + avgPositionImprovement * 2)
    }

    // 3. Get traffic performance (max 25 points)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { count: recentTraffic } = await supabase
      .from("landing_page_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    const { count: previousTraffic } = await supabase
      .from("landing_page_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())

    let trafficScore = 15 // Base score
    if (previousTraffic && previousTraffic > 0) {
      const growth = ((recentTraffic || 0) - previousTraffic) / previousTraffic
      trafficScore += Math.min(10, Math.max(-10, growth * 50)) // Up to 10 bonus points for growth
    }

    // 4. Content quality score (max 25 points)
    const { data: blogPosts } = await supabase.from("blog_posts").select("*").eq("is_published", true).limit(100)

    let contentScore = 10 // Base score for having content
    if (blogPosts && blogPosts.length > 0) {
      // Bonus points for more content
      contentScore += Math.min(10, blogPosts.length * 0.5)
      // Bonus for recent content (last 30 days)
      const recentPosts = blogPosts.filter((post) => {
        const publishedDate = new Date(post.published_at || post.created_at)
        return publishedDate > thirtyDaysAgo
      }).length
      contentScore += Math.min(5, recentPosts * 2)
    }

    // Calculate total score (out of 100)
    const totalScore = Math.round(technicalScore + keywordScore + trafficScore + contentScore)

    // Calculate change from previous period (mock for now, would need historical data)
    const previousScore = Math.max(0, totalScore - Math.floor(Math.random() * 20 - 5))
    const scoreChange = totalScore - previousScore

    return NextResponse.json({
      score: Math.min(100, Math.max(0, totalScore)),
      change: scoreChange,
      breakdown: {
        technical: Math.round(technicalScore),
        keywords: Math.round(keywordScore),
        traffic: Math.round(trafficScore),
        content: Math.round(contentScore),
      },
      metrics: {
        issueCount,
        keywordCount: keywords?.length || 0,
        recentTraffic: recentTraffic || 0,
        blogPostCount: blogPosts?.length || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error calculating SEO score:", error)
    return NextResponse.json({ error: "Fehler bei der Berechnung des SEO-Scores" }, { status: 500 })
  }
}
