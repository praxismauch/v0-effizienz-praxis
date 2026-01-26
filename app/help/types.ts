import type React from "react"

export interface HelpArticle {
  id: string
  title: string
  description: string
  category: string
  categoryId: string
  content: string
  readTime: number
  difficulty: "beginner" | "intermediate" | "advanced"
  tags: string[]
  views: number
  helpful: number
  lastUpdated: string
  author?: string
  relatedArticles?: string[]
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

export interface VideoTutorial {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  videoUrl?: string
  category: string
  categoryId: string
  views: number
  chapters: { title: string; time: string }[]
  transcript?: string
}

// Alias for consistency
export type HelpVideo = VideoTutorial

export interface LearningPath {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  modules: {
    id: string
    title: string
    type: "article" | "video" | "quiz" | "practice"
    duration: string
    completed: boolean
    description?: string
  }[]
  progress: number
  estimatedTime: string
  difficulty: "beginner" | "intermediate" | "advanced"
  enrolledCount: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: { title: string; url: string; type: string }[]
  isStreaming?: boolean
  practiceContext?: boolean
  suggestions?: string[]
}

export interface HelpCategory {
  id: string
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  gradient: string
  description: string
  articleCount: number
}

export interface QuickAction {
  label: string
  icon: React.ElementType
  href: string
  color: string
}
