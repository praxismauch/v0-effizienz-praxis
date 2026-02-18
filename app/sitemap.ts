import type { MetadataRoute } from "next"
import { getAllFeatureSlugs } from "@/lib/features-data"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"
  const now = new Date()

  // ── Landing & Marketing (highest priority) ──
  const marketingPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/effizienz`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/preise`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/demo`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/alle-funktionen`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/selbst-check`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ]

  // ── Feature Detail Pages (dynamically generated) ──
  const featureSlugs = getAllFeatureSlugs()
  const featurePages: MetadataRoute.Sitemap = featureSlugs.map((slug) => ({
    url: `${baseUrl}/features/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // ── Company & Info Pages ──
  const companyPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/ueber-uns`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/karriere`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/sicherheit`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ]

  // ── Content Pages ──
  const contentPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/updates`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/whats-new`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ]

  // ── Legal Pages ──
  const legalPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/agb`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  // ── Auth Pages (low priority, still indexable for SEO) ──
  const authPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/auth/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/auth/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ]

  // ── Dynamic Blog Posts from Database ──
  let blogPosts: MetadataRoute.Sitemap = []
  try {
    if (
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ) {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()

      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("id, slug, updated_at, published")
        .eq("published", true)
        .order("updated_at", { ascending: false })

      if (!error && posts && posts.length > 0) {
        blogPosts = posts.map((post) => ({
          url: `${baseUrl}/blog/${post.slug || post.id}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      }
    }
  } catch {
    // Silently fail - static pages will still be returned
  }

  return [
    ...marketingPages,
    ...featurePages,
    ...companyPages,
    ...contentPages,
    ...legalPages,
    ...authPages,
    ...blogPosts,
  ]
}
