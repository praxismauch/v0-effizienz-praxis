import type { Metadata } from "next"
import { notFound } from "next/navigation"
import FeaturePageClient from "./page-client"
import { getFeatureBySlug, getAllFeatureSlugs } from "@/lib/features-data"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllFeatureSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)

  if (!feature) {
    return {
      title: "Feature nicht gefunden | Effizienz Praxis",
    }
  }

  return {
    title: feature.metaTitle,
    description: feature.metaDescription,
    openGraph: {
      title: feature.metaTitle,
      description: feature.metaDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: feature.metaTitle,
      description: feature.metaDescription,
    },
  }
}

export default async function FeaturePage({ params }: PageProps) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)

  if (!feature) {
    notFound()
  }

  return <FeaturePageClient slug={slug} />
}
