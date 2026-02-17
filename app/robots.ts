import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features/",
          "/blog/",
          "/effizienz",
          "/preise",
          "/demo",
          "/ueber-uns",
          "/kontakt",
          "/karriere",
          "/sicherheit",
          "/updates",
          "/whats-new",
          "/help",
          "/impressum",
          "/datenschutz",
          "/agb",
        ],
        disallow: [
          "/api/",
          "/super-admin/",
          "/dashboard/",
          "/team/",
          "/settings/",
          "/protocols/",
          "/analytics/",
          "/kalender/",
          "/todos/",
          "/aufgaben/",
          "/workflows/",
          "/dokumente/",
          "/wissen/",
          "/ziele/",
          "/personal/",
          "/zeiterfassung/",
          "/dienstplan/",
          "/hygiene/",
          "/cirs/",
          "/profile/",
          "/auth/callback",
          "/auth/pending-approval",
          "/auth/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
