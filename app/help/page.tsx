"use client"

import { useState } from "react"
import { Search, Home, BookOpen, MonitorPlay, GraduationCap, HelpCircle, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LandingPageLayout } from "@/components/landing-page-layout"

// Import components
import { HelpHero } from "./components/help-hero"
import { OverviewTab } from "./components/overview-tab"
import { ArticlesTab } from "./components/articles-tab"
import { VideosTab } from "./components/videos-tab"
import { LearningTab } from "./components/learning-tab"
import { FAQTab } from "./components/faq-tab"
import { AIAssistantTab } from "./components/ai-assistant-tab"

// Import data and types
import { helpCategories, helpArticles, videoTutorials, faqs, learningPaths, suggestedQuestions, quickActions } from "./data"
import type { HelpArticle, VideoTutorial, FAQ, LearningPath, HelpCategory } from "./types"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "alphabetical">("popular")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null)

  // Filter articles based on search and category
  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Filter videos based on search
  const filteredVideos = videoTutorials.filter((video) => {
    return (
      searchQuery === "" ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter((faq) => {
    return (
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    setActiveTab("articles")
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setActiveTab("articles")
    }
  }

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <HelpHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
              <TabsTrigger
                value="overview"
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Übersicht</span>
              </TabsTrigger>
              <TabsTrigger
                value="articles"
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Artikel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="videos" 
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <MonitorPlay className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger
                value="learning"
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Lernpfade</span>
              </TabsTrigger>
              <TabsTrigger 
                value="faq" 
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQ</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">KI-Assistent</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <OverviewTab
                categories={helpCategories}
                articles={helpArticles}
                quickActions={quickActions}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                onArticleSelect={(article) => setSelectedArticle(article)}
                onTabChange={setActiveTab}
              />
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles">
              <ArticlesTab
                articles={filteredArticles}
                categories={helpCategories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onArticleSelect={(article) => setSelectedArticle(article)}
              />
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <VideosTab videos={filteredVideos} onSelectVideo={(video) => setSelectedVideo(video)} />
            </TabsContent>

            {/* Learning Paths Tab */}
            <TabsContent value="learning">
              <LearningTab learningPaths={learningPaths} />
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <FAQTab faqs={filteredFaqs} />
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai">
              <AIAssistantTab suggestedQuestions={suggestedQuestions} />
            </TabsContent>
          </Tabs>
        </div>
    </LandingPageLayout>
  )
}
