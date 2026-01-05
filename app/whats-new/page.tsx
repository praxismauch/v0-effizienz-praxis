"use client"

import { useEffect, useState } from "react"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar, Tag } from "lucide-react"

interface ChangelogEntry {
  id: string
  version: string
  release_date: string
  title: string
  description: string
  changes: {
    category: string
    items: string[]
  }[]
  change_type: "major" | "minor" | "patch"
}

export default function WhatsNewPage() {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChangelogs()
  }, [])

  const fetchChangelogs = async () => {
    try {
      const response = await fetch("/api/changelogs?published=true")
      if (!response.ok) throw new Error("Failed to fetch changelogs")
      const data = await response.json()
      setChangelogs(data)
    } catch (error) {
      console.error("[v0] Error fetching changelogs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      major: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Major Update" },
      minor: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Minor Update" },
      patch: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Patch" },
    }
    const variant = variants[type] || variants.minor
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes("feature") || cat.includes("neu")) return "✨"
    if (cat.includes("improvement") || cat.includes("verbesserung")) return "🚀"
    if (cat.includes("fix") || cat.includes("bugfix")) return "🐛"
    if (cat.includes("security") || cat.includes("sicherheit")) return "🔒"
    return "📝"
  }

  return (
    <LandingPageLayout>
      <section className="container py-12 md:py-20 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
            <Sparkles className="inline h-4 w-4 mr-1" />
            Release Notes
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
            Was ist neu?
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
            Entdecken Sie die neuesten Features, Verbesserungen und Updates für Ihre Praxis-Management-Plattform
          </p>
        </div>
      </section>

      <main className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-8 animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : changelogs.length === 0 ? (
            <Card className="p-16 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">Noch keine Updates verfügbar</h3>
              <p className="text-muted-foreground">
                Schauen Sie bald wieder vorbei für die neuesten Informationen über Produktupdates
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {changelogs.map((changelog, index) => (
                <Card
                  key={changelog.id}
                  className="p-8 hover:shadow-lg transition-all border-l-4 border-l-primary"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-2xl font-bold text-foreground">{changelog.title}</h2>
                        {getChangeTypeBadge(changelog.change_type)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-4 w-4" />
                          <span className="font-medium">Version {changelog.version}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(changelog.release_date).toLocaleDateString("de-DE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {changelog.description && (
                      <p className="text-muted-foreground text-lg leading-relaxed">{changelog.description}</p>
                    )}

                    {/* Changes */}
                    {changelog.changes && changelog.changes.length > 0 && (
                      <div className="space-y-6 pt-4 border-t">
                        {changelog.changes.map((section, idx) => (
                          <div key={idx}>
                            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                              <span className="text-2xl">{getCategoryIcon(section.category)}</span>
                              {section.category}
                            </h3>
                            <ul className="space-y-2.5 pl-10">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-3 text-muted-foreground">
                                  <span className="text-primary mt-1 font-bold">•</span>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </LandingPageLayout>
  )
}
