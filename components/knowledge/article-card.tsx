"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Cpu, Package, Wrench, Pencil, Trash2 } from "lucide-react"
import type { KnowledgeArticle } from "./types"

interface ArticleCardProps {
  article: KnowledgeArticle
  onEdit?: (article: KnowledgeArticle) => void
  onDelete?: (article: KnowledgeArticle) => void
  showActions?: boolean
}

export function getSourceIcon(sourceType?: string) {
  switch (sourceType) {
    case "device":
      return <Cpu className="h-4 w-4 text-blue-500" />
    case "material":
      return <Package className="h-4 w-4 text-orange-500" />
    case "arbeitsmittel":
      return <Wrench className="h-4 w-4 text-green-500" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

export function getSourceBadge(sourceType?: string) {
  switch (sourceType) {
    case "device":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Gerät
        </Badge>
      )
    case "material":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Material
        </Badge>
      )
    case "arbeitsmittel":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Arbeitsmittel
        </Badge>
      )
    default:
      return null
  }
}

export const ArticleCard = memo(function ArticleCard({
  article,
  onEdit,
  onDelete,
  showActions = false,
}: ArticleCardProps) {
  const handleClick = () => {
    if (article.source_type && article.source_link) {
      window.location.href = article.source_link
    } else if (onEdit) {
      onEdit(article)
    }
  }

  return (
    <Card
      className={`group relative p-4 hover:bg-muted/50 transition-colors cursor-pointer`}
      onClick={handleClick}
    >
      {showActions && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(article)
            }}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Bearbeiten</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(article)
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Löschen</span>
          </Button>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {getSourceIcon(article.source_type)}
            <h3 className="font-semibold">{article.title}</h3>
            {getSourceBadge(article.source_type)}
            {!article.source_type && article.status === "published" && (
              <Badge variant="default">Veröffentlicht</Badge>
            )}
            {!article.source_type && article.status === "draft" && (
              <Badge variant="secondary">Entwurf</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.content.substring(0, 150)}...
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Kategorie: {article.category}</span>
            {!article.source_type && (
              <>
                <span>•</span>
                <span>Version {article.version}</span>
              </>
            )}
            <span>•</span>
            <span>{new Date(article.updated_at).toLocaleDateString("de-DE")}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {article.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
})
