"use client"

import { ChevronRight, Clock, Eye, Sparkles, Bot } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HelpArticle, HelpCategory, QuickAction } from "../types"
import { getDifficultyBadge } from "../utils"

interface OverviewTabProps {
  categories: HelpCategory[]
  articles: HelpArticle[]
  quickActions: QuickAction[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string) => void
  onArticleSelect: (article: HelpArticle) => void
  onTabChange: (tab: string) => void
}

export function OverviewTab({
  categories,
  articles,
  quickActions,
  selectedCategory,
  onCategorySelect,
  onArticleSelect,
  onTabChange,
}: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Kategorien durchsuchen</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group border-2",
                  selectedCategory === category.id
                    ? "border-primary"
                    : "border-transparent hover:border-primary/20",
                )}
                onClick={() => {
                  onCategorySelect(category.id)
                  onTabChange("articles")
                }}
              >
                <CardContent className="p-5">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                      category.bgColor,
                    )}
                  >
                    <Icon className={cn("h-6 w-6", category.color)} />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {category.articleCount} Artikel
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Popular Articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Beliebte Artikel</h2>
          <Button variant="ghost" size="sm" onClick={() => onTabChange("articles")}>
            Alle anzeigen <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.slice(0, 3).map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => onArticleSelect(article)}
            >
              <CardContent className="p-5">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{article.readTime} Min. Lesezeit</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 bg-transparent"
                onClick={() => (window.location.href = action.href)}
              >
                <Icon className={cn("h-5 w-5", action.color)} />
                <span className="text-sm">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* AI Assistant Promo */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/25">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">KI-Assistent</h3>
              <p className="text-muted-foreground mb-4">
                Stellen Sie Ihre Fragen in natürlicher Sprache. Unser KI-Assistent kennt alle Funktionen und
                kann personalisierte Hilfe basierend auf Ihrer Praxiskonfiguration geben.
              </p>
              <Button
                onClick={() => onTabChange("ai")}
                className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Jetzt fragen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
