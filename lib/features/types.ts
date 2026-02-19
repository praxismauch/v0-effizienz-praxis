import type React from "react"

export interface FeatureData {
  slug: string
  title: string
  subtitle: string
  description: string
  detailedDescription: {
    intro: string
    howItWorks: string
    whyItHelps: string
  }
  iconName: string
  color: string
  heroImage?: string
  benefits: {
    title: string
    description: string
  }[]
  features: {
    title: string
    description: string
    iconName: string
  }[]
  useCases?: {
    title: string
    description: string
  }[]
  faq?: {
    question: string
    answer: string
  }[]
  relatedFeatureSlugs?: string[]
  metaTitle: string
  metaDescription: string
}
