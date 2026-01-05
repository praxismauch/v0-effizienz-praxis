import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createAdminClient()

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://effizienz-praxis.de"

    const routes = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/dashboard", priority: "0.9", changefreq: "daily" },
      { url: "/team", priority: "0.8", changefreq: "weekly" },
      { url: "/ziele", priority: "0.8", changefreq: "weekly" },
      { url: "/aufgaben", priority: "0.8", changefreq: "daily" },
      { url: "/analytics", priority: "0.7", changefreq: "weekly" },
      { url: "/kalender", priority: "0.7", changefreq: "daily" },
      { url: "/settings", priority: "0.6", changefreq: "monthly" },
      { url: "/personal", priority: "0.7", changefreq: "weekly" },
      { url: "/workflows", priority: "0.7", changefreq: "weekly" },
      { url: "/dokumente", priority: "0.7", changefreq: "weekly" },
      { url: "/wissen", priority: "0.6", changefreq: "weekly" },
      { url: "/protocols", priority: "0.7", changefreq: "weekly" },
    ]

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${appUrl}${route.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`

    // In a production environment, you would save this to a file or database
    // For now, we'll just return the URL where it should be accessible
    const sitemapUrl = `${appUrl}/sitemap.xml`

    return NextResponse.json({
      success: true,
      sitemapUrl,
      message: "Sitemap erfolgreich generiert",
    })
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return NextResponse.json({ error: "Failed to generate sitemap" }, { status: 500 })
  }
}
