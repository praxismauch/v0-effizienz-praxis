"use client"

import { Clock, Eye, Filter, SortAsc, Grid3X3, List, FileQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { HelpArticle, HelpCategory } from "../types"
import { getDifficultyBadge } from "../utils"

interface ArticlesTabProps {
  articles: HelpArticle[]
  categories: HelpCategory[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
  sortBy: "popular" | "recent" | "alphabetical"
  onSortChange: (sort: "popular" | "recent" | "alphabetical") => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onArticleSelect: (article: HelpArticle) => void
}

export function ArticlesTab({
  articles,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onArticleSelect,
}: ArticlesTabProps) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedCategory || "all"}
            onValueChange={(v) => onCategoryChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Beliebteste</SelectItem>
              <SelectItem value="recent">Neueste</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Articles Grid/List */}
      <div className={cn(viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3")}>
        {articles.map((article) => (
          <Card
            key={article.id}
            className={cn(
              "cursor-pointer hover:shadow-md transition-all group",
              viewMode === "list" && "flex items-center",
            )}
            onClick={() => onArticleSelect(article)}
          >
            <CardContent className={cn("p-5", viewMode === "list" && "flex items-center gap-4 w-full")}>
              {viewMode === "grid" ? (
                <>
                  <div className="flex items-start justify-between mb-3">
                    {getDifficultyBadge(article.difficulty)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {article.views.toLocaleString()}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime} Min.</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                        {article.title}
                      </h3>
                      {getDifficultyBadge(article.difficulty)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{article.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime} Min.
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Artikel gefunden</h3>
          <p className="text-muted-foreground">Versuchen Sie eine andere Suche oder Kategorie.</p>
        </div>
      )}
    </div>
  )
}
