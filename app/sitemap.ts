import type { MetadataRoute } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"

  const staticPages: MetadataRoute.Sitemap = [
    // Landing & Marketing Pages (Highest Priority)
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/effizienz`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/preise`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // Company & Info Pages
    {
      url: `${baseUrl}/ueber-uns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/karriere`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sicherheit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // Content Pages
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/whats-new`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // Legal Pages
    {
      url: `${baseUrl}/impressum`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/agb`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },

    // Auth Pages (Low Priority)
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  let blogPosts: MetadataRoute.Sitemap = []

  try {
    // Only attempt to fetch blog posts if Supabase credentials are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
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
    // This prevents the sitemap from returning HTML error page
  }

  return [...staticPages, ...blogPosts]
}
