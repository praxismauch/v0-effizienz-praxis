"use client"

import { notFound } from "next/navigation"
import { FeaturePageTemplate } from "@/components/feature-page-template"
import { getFeatureBySlug, getRelatedFeatures, getFeatureIcon, type FeatureData } from "@/lib/features-data"

interface FeaturePageClientProps {
  slug: string
}

export default function FeaturePageClient({ slug }: FeaturePageClientProps) {
  const feature = getFeatureBySlug(slug)

  if (!feature) {
    notFound()
  }

  const featureIcon = getFeatureIcon(feature.iconName)

  const relatedFeaturesData = feature.relatedFeatureSlugs ? getRelatedFeatures(feature.relatedFeatureSlugs) : []

  const relatedFeatures = relatedFeaturesData.map((rf: FeatureData) => ({
    title: rf.title,
    href: `/features/${rf.slug}`,
    icon: getFeatureIcon(rf.iconName),
    color: rf.color,
  }))

  const featuresWithIcons = feature.features.map((f) => ({
    ...f,
    icon: getFeatureIcon(f.iconName),
  }))

  return (
    <FeaturePageTemplate
      title={feature.title}
      subtitle={feature.subtitle}
      description={feature.description}
      icon={featureIcon}
      color={feature.color}
      benefits={feature.benefits}
      features={featuresWithIcons}
      useCases={feature.useCases}
      faq={feature.faq}
      relatedFeatures={relatedFeatures}
      detailedDescription={feature.detailedDescription}
    />
  )
}
