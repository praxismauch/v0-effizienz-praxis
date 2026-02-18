import type { FeatureData } from "./types"

// This module receives the data array via setFeaturesData() to avoid circular imports.
// features-data.ts calls setFeaturesData() after defining the array.
let _data: FeatureData[] = []

export function setFeaturesData(data: FeatureData[]): void {
  _data = data
}

function getData(): FeatureData[] {
  return _data
}

/** Normalize German umlauts for slug matching */
function normalizeGermanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
}

/** Get all features matching the given slugs */
export function getFeaturesByCategory(slugs: string[]): FeatureData[] {
  return getData().filter((f) => slugs.includes(f.slug))
}

/** Get a single feature by its slug (supports URL-encoded and umlaut-normalized slugs) */
export function getFeatureBySlug(slug: string): FeatureData | undefined {
  const decodedSlug = decodeURIComponent(slug)
  const normalizedSlug = normalizeGermanSlug(decodedSlug)

  return getData().find(
    (feature) =>
      feature.slug === slug ||
      feature.slug === decodedSlug ||
      feature.slug === normalizedSlug
  )
}

/** Get all feature slugs for static generation */
export function getAllFeatureSlugs(): string[] {
  return getData().map((feature) => feature.slug)
}

/** Get related features by slug array */
export function getRelatedFeatures(slugs: string[]): FeatureData[] {
  return slugs
    .map((slug) => getFeatureBySlug(slug))
    .filter((f): f is FeatureData => f !== undefined)
}
