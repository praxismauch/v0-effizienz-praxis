// Social Media Platform Specifications
// Official requirements for each platform as of 2024

export interface PlatformSpec {
  id: string
  name: string
  icon: string
  color: string
  // Image specifications
  image: {
    feedPost: { width: number; height: number; aspectRatio: string; maxFileSize: string }
    story: { width: number; height: number; aspectRatio: string; maxFileSize: string }
    reels?: { width: number; height: number; aspectRatio: string; maxFileSize: string }
    cover?: { width: number; height: number; aspectRatio: string }
    profile?: { width: number; height: number }
  }
  // Text specifications
  text: {
    maxLength: number
    optimalLength: number
    hashtagLimit?: number
    linkPreview?: boolean
  }
  // Content best practices
  bestPractices: string[]
  // Supported formats
  formats: string[]
}

export const SOCIAL_MEDIA_PLATFORMS: Record<string, PlatformSpec> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "Instagram",
    color: "#E4405F",
    image: {
      feedPost: { width: 1080, height: 1080, aspectRatio: "1:1", maxFileSize: "30MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "30MB" },
      reels: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "4GB" },
      profile: { width: 320, height: 320 },
    },
    text: {
      maxLength: 2200,
      optimalLength: 150,
      hashtagLimit: 30,
      linkPreview: false,
    },
    bestPractices: [
      "Nutze 3-5 relevante Hashtags",
      "Erste Zeile als Hook verwenden",
      "Call-to-Action einbauen",
      "Emojis sparsam einsetzen",
      "Carousel-Posts für mehr Engagement",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4", "MOV"],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "Facebook",
    color: "#1877F2",
    image: {
      feedPost: { width: 1200, height: 630, aspectRatio: "1.91:1", maxFileSize: "30MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "4GB" },
      cover: { width: 820, height: 312, aspectRatio: "2.63:1" },
      profile: { width: 180, height: 180 },
    },
    text: {
      maxLength: 63206,
      optimalLength: 80,
      linkPreview: true,
    },
    bestPractices: [
      "Kurze, prägnante Texte",
      "Fragen stellen für Engagement",
      "Native Videos bevorzugen",
      "Link-Vorschau optimieren",
      "Beste Posting-Zeit: 9-12 Uhr",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4", "MOV"],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: "Linkedin",
    color: "#0A66C2",
    image: {
      feedPost: { width: 1200, height: 627, aspectRatio: "1.91:1", maxFileSize: "10MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "4GB" },
      cover: { width: 1584, height: 396, aspectRatio: "4:1" },
      profile: { width: 400, height: 400 },
    },
    text: {
      maxLength: 3000,
      optimalLength: 150,
      hashtagLimit: 5,
      linkPreview: true,
    },
    bestPractices: [
      "Professionellen Ton beibehalten",
      "Branchen-Insights teilen",
      "Persönliche Geschichten erzählen",
      "Max. 3-5 Hashtags nutzen",
      "Dienstag-Donnerstag posten",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4"],
  },
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    icon: "Twitter",
    color: "#000000",
    image: {
      feedPost: { width: 1200, height: 675, aspectRatio: "16:9", maxFileSize: "5MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "512MB" },
      cover: { width: 1500, height: 500, aspectRatio: "3:1" },
      profile: { width: 400, height: 400 },
    },
    text: {
      maxLength: 280,
      optimalLength: 100,
      hashtagLimit: 3,
      linkPreview: true,
    },
    bestPractices: [
      "Kurz und prägnant",
      "Threads für längere Inhalte",
      "Aktuelle Trends nutzen",
      "Visuelle Inhalte erhöhen Reichweite",
      "Regelmäßig interagieren",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "Video",
    color: "#000000",
    image: {
      feedPost: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "287MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "287MB" },
      profile: { width: 200, height: 200 },
    },
    text: {
      maxLength: 2200,
      optimalLength: 100,
      hashtagLimit: 5,
      linkPreview: false,
    },
    bestPractices: [
      "Vertikales Format (9:16)",
      "Hook in ersten 3 Sekunden",
      "Trending Sounds nutzen",
      "Authentischer Content",
      "15-60 Sekunden optimal",
    ],
    formats: ["MP4", "MOV"],
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "Pin",
    color: "#E60023",
    image: {
      feedPost: { width: 1000, height: 1500, aspectRatio: "2:3", maxFileSize: "20MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "20MB" },
      profile: { width: 165, height: 165 },
    },
    text: {
      maxLength: 500,
      optimalLength: 100,
      hashtagLimit: 20,
      linkPreview: true,
    },
    bestPractices: [
      "Vertikale Pins bevorzugen (2:3)",
      "Text-Overlay auf Bildern",
      "Keywords in Beschreibung",
      "Rich Pins aktivieren",
      "Saisonale Inhalte früh posten",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: "Youtube",
    color: "#FF0000",
    image: {
      feedPost: { width: 1280, height: 720, aspectRatio: "16:9", maxFileSize: "2MB" },
      story: { width: 1080, height: 1920, aspectRatio: "9:16", maxFileSize: "256GB" },
      cover: { width: 2560, height: 1440, aspectRatio: "16:9" },
      profile: { width: 800, height: 800 },
    },
    text: {
      maxLength: 5000,
      optimalLength: 200,
      hashtagLimit: 15,
      linkPreview: true,
    },
    bestPractices: [
      "Thumbnail mit Gesicht",
      "Ersten 48h entscheidend",
      "Beschreibung SEO-optimieren",
      "Cards und Endscreens nutzen",
      "Community Tab aktivieren",
    ],
    formats: ["JPEG", "PNG", "GIF", "MP4", "MOV", "AVI"],
  },
}

export type PlatformId = keyof typeof SOCIAL_MEDIA_PLATFORMS

export function getPlatform(id: string): PlatformSpec | undefined {
  return SOCIAL_MEDIA_PLATFORMS[id]
}

export function getAllPlatforms(): PlatformSpec[] {
  return Object.values(SOCIAL_MEDIA_PLATFORMS)
}

export function getImageSizeForPlatform(
  platformId: string,
  type: "feedPost" | "story" | "reels" | "cover" = "feedPost",
): { width: number; height: number; aspectRatio: string } | undefined {
  const platform = getPlatform(platformId)
  if (!platform) return undefined
  return platform.image[type]
}

export function getTextLimits(platformId: string): { maxLength: number; optimalLength: number } | undefined {
  const platform = getPlatform(platformId)
  if (!platform) return undefined
  return { maxLength: platform.text.maxLength, optimalLength: platform.text.optimalLength }
}

export function validateText(
  platformId: string,
  text: string,
): { valid: boolean; message?: string; charCount: number } {
  const platform = getPlatform(platformId)
  if (!platform) return { valid: false, message: "Plattform nicht gefunden", charCount: text.length }

  const charCount = text.length
  if (charCount > platform.text.maxLength) {
    return {
      valid: false,
      message: `Text ist ${charCount - platform.text.maxLength} Zeichen zu lang (max. ${platform.text.maxLength})`,
      charCount,
    }
  }

  return { valid: true, charCount }
}

export function countHashtags(text: string): number {
  const matches = text.match(/#\w+/g)
  return matches ? matches.length : 0
}

export function validateHashtags(
  platformId: string,
  text: string,
): { valid: boolean; count: number; limit?: number; message?: string } {
  const platform = getPlatform(platformId)
  if (!platform) return { valid: false, count: 0, message: "Plattform nicht gefunden" }

  const count = countHashtags(text)
  const limit = platform.text.hashtagLimit

  if (limit && count > limit) {
    return {
      valid: false,
      count,
      limit,
      message: `Zu viele Hashtags (${count}/${limit})`,
    }
  }

  return { valid: true, count, limit }
}

// Map platform to FAL image size
export function getFalImageSize(platformId: string, type: "feedPost" | "story" = "feedPost"): string {
  const sizeMap: Record<string, Record<string, string>> = {
    instagram: { feedPost: "square_hd", story: "portrait_16_9" },
    facebook: { feedPost: "landscape_16_9", story: "portrait_16_9" },
    linkedin: { feedPost: "landscape_16_9", story: "portrait_16_9" },
    twitter: { feedPost: "landscape_16_9", story: "portrait_16_9" },
    tiktok: { feedPost: "portrait_16_9", story: "portrait_16_9" },
    pinterest: { feedPost: "portrait_4_3", story: "portrait_16_9" },
    youtube: { feedPost: "landscape_16_9", story: "portrait_16_9" },
  }
  return sizeMap[platformId]?.[type] || "square_hd"
}

// Map platform to Google aspect ratio
export function getGoogleAspectRatio(platformId: string, type: "feedPost" | "story" = "feedPost"): string {
  const aspectMap: Record<string, Record<string, string>> = {
    instagram: { feedPost: "1:1", story: "9:16" },
    facebook: { feedPost: "16:9", story: "9:16" },
    linkedin: { feedPost: "16:9", story: "9:16" },
    twitter: { feedPost: "16:9", story: "9:16" },
    tiktok: { feedPost: "9:16", story: "9:16" },
    pinterest: { feedPost: "3:4", story: "9:16" },
    youtube: { feedPost: "16:9", story: "9:16" },
  }
  return aspectMap[platformId]?.[type] || "1:1"
}
