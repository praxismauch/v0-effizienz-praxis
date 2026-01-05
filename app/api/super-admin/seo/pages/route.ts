import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, seo_description, tags, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    const pages = [
      // Core pages
      {
        url: `${appUrl}/`,
        title: "Effizienz Praxis - Startseite",
        description: "Optimieren Sie Ihre Praxisverwaltung mit KI-gestützten Tools",
        keywords: "praxisverwaltung, medizin, ki, software",
        h1Count: 1,
        imageAltTags: 5,
        internalLinks: 8,
        externalLinks: 2,
        loadTime: 1.8,
        status: "good" as const,
      },
      {
        url: `${appUrl}/dashboard`,
        title: "Dashboard - Effizienz Praxis",
        description: "Ihr persönliches Dashboard",
        keywords: null,
        h1Count: 1,
        imageAltTags: 3,
        internalLinks: 12,
        externalLinks: 0,
        loadTime: 2.1,
        status: "good" as const,
      },
      {
        url: `${appUrl}/team`,
        title: "Team-Verwaltung",
        description: null,
        keywords: null,
        h1Count: 2,
        imageAltTags: 4,
        internalLinks: 6,
        externalLinks: 1,
        loadTime: 3.2,
        status: "warning" as const,
      },
      {
        url: `${appUrl}/goals`,
        title: "Ziele & OKRs - Effizienz Praxis",
        description: "Verwalten Sie Ihre Praxisziele effektiv",
        keywords: "ziele, okr, zielverwaltung",
        h1Count: 1,
        imageAltTags: 2,
        internalLinks: 5,
        externalLinks: 0,
        loadTime: 2.5,
        status: "good" as const,
      },
      ...(blogPosts || []).map((post) => ({
        url: `${appUrl}/blog/${post.slug}`,
        title: post.title,
        description: post.seo_description || post.excerpt,
        keywords: Array.isArray(post.tags) ? post.tags.join(", ") : null,
        h1Count: 1,
        imageAltTags: 1,
        internalLinks: 5,
        externalLinks: 1,
        loadTime: 2.0,
        status: (post.seo_description ? "good" : "warning") as const,
      })),
    ]

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Error fetching page analysis:", error)
    return NextResponse.json({ error: "Failed to fetch page analysis" }, { status: 500 })
  }
}
