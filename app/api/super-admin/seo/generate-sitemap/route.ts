import { NextResponse } from "next/server"
import { getAllFeatureSlugs } from "@/lib/features-data"

export async function POST() {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://effizienz-praxis.de")

    const featureSlugs = getAllFeatureSlugs()
    const now = new Date().toISOString()

    const staticRoutes = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/effizienz", priority: "0.9", changefreq: "weekly" },
      { url: "/preise", priority: "0.9", changefreq: "weekly" },
      { url: "/demo", priority: "0.9", changefreq: "weekly" },
      { url: "/ueber-uns", priority: "0.8", changefreq: "monthly" },
      { url: "/kontakt", priority: "0.8", changefreq: "monthly" },
      { url: "/karriere", priority: "0.7", changefreq: "weekly" },
      { url: "/sicherheit", priority: "0.7", changefreq: "monthly" },
      { url: "/blog", priority: "0.8", changefreq: "daily" },
      { url: "/updates", priority: "0.7", changefreq: "weekly" },
      { url: "/whats-new", priority: "0.7", changefreq: "weekly" },
      { url: "/help", priority: "0.6", changefreq: "monthly" },
      { url: "/impressum", priority: "0.5", changefreq: "yearly" },
      { url: "/datenschutz", priority: "0.5", changefreq: "yearly" },
      { url: "/agb", priority: "0.5", changefreq: "yearly" },
      { url: "/auth/login", priority: "0.4", changefreq: "monthly" },
      { url: "/auth/sign-up", priority: "0.4", changefreq: "monthly" },
    ]

    const featureRoutes = featureSlugs.map((slug) => ({
      url: `/features/${slug}`,
      priority: "0.8",
      changefreq: "monthly",
    }))

    const allRoutes = [...staticRoutes, ...featureRoutes]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${appUrl}${route.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`

    return NextResponse.json({
      success: true,
      sitemapUrl: `${appUrl}/sitemap.xml`,
      totalUrls: allRoutes.length,
      featurePages: featureRoutes.length,
      message: `Sitemap erfolgreich generiert mit ${allRoutes.length} URLs (davon ${featureRoutes.length} Feature-Seiten)`,
      preview: sitemap,
    })
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return NextResponse.json({ error: "Sitemap konnte nicht generiert werden" }, { status: 500 })
  }
}
