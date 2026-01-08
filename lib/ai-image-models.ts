// Centralized AI Image Model Configuration
// Used across the app for image generation features

export interface AIImageModel {
  id: string
  name: string
  description: string
  provider: "fal" | "google"
  modelId: string
  defaultSettings: {
    image_size?: string
    num_inference_steps?: number
    guidance_scale?: number
    enable_safety_checker?: boolean
    aspectRatio?: string
    numberOfImages?: number
  }
  bestFor: string[]
  speed: "fast" | "medium" | "slow"
  quality: "standard" | "high" | "premium"
  requiresApiKey?: string
}

export const AI_IMAGE_MODELS: AIImageModel[] = [
  {
    id: "flux-schnell",
    name: "FLUX Schnell",
    description: "Schnelle, hochwertige Bildgenerierung",
    provider: "fal",
    modelId: "fal-ai/flux/schnell",
    defaultSettings: {
      image_size: "square_hd",
      num_inference_steps: 4,
      enable_safety_checker: true,
    },
    bestFor: ["Schnelle Vorschauen", "Allgemeine Bilder", "Porträts"],
    speed: "fast",
    quality: "high",
  },
  {
    id: "flux-pro",
    name: "FLUX Pro",
    description: "Premium-Qualität für professionelle Bilder",
    provider: "fal",
    modelId: "fal-ai/flux-pro/v1.1",
    defaultSettings: {
      image_size: "landscape_16_9",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    },
    bestFor: ["Header-Bilder", "Marketing", "Professionelle Fotos"],
    speed: "medium",
    quality: "premium",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    description: "Optimiert für Social Media Bilder mit lebendigen Farben",
    provider: "fal",
    modelId: "fal-ai/minimax-image",
    defaultSettings: {
      image_size: "square_hd",
      num_inference_steps: 25,
      enable_safety_checker: true,
    },
    bestFor: ["Social Media Posts", "Instagram", "Facebook", "Marketing-Grafiken"],
    speed: "medium",
    quality: "high",
  },
  {
    id: "imagen-3",
    name: "Google Imagen 3",
    description: "Googles neuestes Bildgenerierungsmodell mit hoher Qualität",
    provider: "google",
    modelId: "imagen-3.0-generate-001",
    defaultSettings: {
      aspectRatio: "1:1",
      numberOfImages: 1,
    },
    bestFor: ["Fotorealistische Bilder", "Produktfotos", "Marketing"],
    speed: "medium",
    quality: "premium",
    requiresApiKey: "GOOGLE_AI_API_KEY",
  },
  {
    id: "imagen-3-fast",
    name: "Google Imagen 3 Fast",
    description: "Schnellere Version von Imagen 3 für schnelle Iterationen",
    provider: "google",
    modelId: "imagen-3.0-fast-generate-001",
    defaultSettings: {
      aspectRatio: "1:1",
      numberOfImages: 1,
    },
    bestFor: ["Schnelle Vorschauen", "Iterationen", "Konzepte"],
    speed: "fast",
    quality: "high",
    requiresApiKey: "GOOGLE_AI_API_KEY",
  },
  {
    id: "flux-dev",
    name: "FLUX Dev",
    description: "Ausgewogene Qualität und Geschwindigkeit",
    provider: "fal",
    modelId: "fal-ai/flux/dev",
    defaultSettings: {
      image_size: "square_hd",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    },
    bestFor: ["Kreative Projekte", "Experimente", "Variationen"],
    speed: "medium",
    quality: "high",
  },
  {
    id: "recraft-v3",
    name: "Recraft V3",
    description: "Spezialisiert auf Illustrationen und Designs",
    provider: "fal",
    modelId: "fal-ai/recraft-v3",
    defaultSettings: {
      image_size: "square_hd",
      enable_safety_checker: true,
    },
    bestFor: ["Illustrationen", "Icons", "Grafik-Design", "Logo-Konzepte"],
    speed: "medium",
    quality: "high",
  },
]

export const DEFAULT_MODEL_ID = "flux-schnell"
export const SOCIAL_MEDIA_MODEL_ID = "nano-banana"

export function getModelById(id: string): AIImageModel | undefined {
  return AI_IMAGE_MODELS.find((model) => model.id === id)
}

export function getModelByUseCase(useCase: string): AIImageModel | undefined {
  const normalizedUseCase = useCase.toLowerCase()
  return AI_IMAGE_MODELS.find((model) => model.bestFor.some((best) => best.toLowerCase().includes(normalizedUseCase)))
}

export function getSocialMediaModel(): AIImageModel {
  return getModelById(SOCIAL_MEDIA_MODEL_ID) || AI_IMAGE_MODELS[0]
}

export function getDefaultModel(): AIImageModel {
  return getModelById(DEFAULT_MODEL_ID) || AI_IMAGE_MODELS[0]
}

export function getAvailableModels(availableApiKeys: string[]): AIImageModel[] {
  return AI_IMAGE_MODELS.filter((model) => {
    if (!model.requiresApiKey) return true
    return availableApiKeys.includes(model.requiresApiKey)
  })
}

export const GOOGLE_ASPECT_RATIOS = {
  square: "1:1",
  landscape: "16:9",
  portrait: "9:16",
  wide: "4:3",
  tall: "3:4",
} as const

// Image size options for different platforms
export const IMAGE_SIZES = {
  square: "square_hd",
  landscape: "landscape_16_9",
  portrait: "portrait_16_9",
  instagram_square: "square_hd",
  instagram_story: "portrait_16_9",
  facebook_post: "landscape_16_9",
  twitter_post: "landscape_16_9",
} as const

export type ImageSizeKey = keyof typeof IMAGE_SIZES
export type GoogleAspectRatioKey = keyof typeof GOOGLE_ASPECT_RATIOS
