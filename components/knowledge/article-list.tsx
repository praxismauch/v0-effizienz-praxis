"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Archive } from "lucide-react"
import { ArticleCard } from "./article-card"
import type { KnowledgeArticle } from "./types"

interface ArticleListProps {
  articles: KnowledgeArticle[]
  status: "published" | "draft" | "archived"
  onEdit?: (article: KnowledgeArticle) => void
  onDelete?: (article: KnowledgeArticle) => void
}

export const ArticleList = memo(function ArticleList({
  articles,
  status,
  onEdit,
  onDelete,
}: ArticleListProps) {
  const filteredArticles = articles.filter((a) => a.status === status)

  if (filteredArticles.length === 0) {
    return (
      <Card className="p-12 text-center">
        {status === "archived" ? (
          <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        ) : (
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg font-semibold mb-2">
          {status === "published" && "Keine Einträge gefunden"}
          {status === "draft" && "Keine Entwürfe"}
          {status === "archived" && "Keine archivierten Artikel"}
        </h3>
        <p className="text-muted-foreground">
          {status === "published" && "Erstellen Sie Artikel oder fügen Sie Geräte/Material hinzu."}
          {status === "draft" && "Erstellen Sie einen Artikel-Entwurf."}
          {status === "archived" && "Archivierte Artikel werden hier angezeigt."}
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {filteredArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={status === "draft"}
        />
      ))}
    </div>
  )
})
