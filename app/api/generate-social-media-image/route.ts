import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { createClient } from "@/lib/supabase/server"
import { getModelById, getSocialMediaModel, IMAGE_SIZES, type ImageSizeKey } from "@/lib/ai-image-models"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

async function generateWithGoogleAI(prompt: string, modelId: string, aspectRatio: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY nicht konfiguriert")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateImages?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Google AI Fehler: ${response.status}`)
  }

  const data = await response.json()

  // Google returns base64 encoded images
  if (data.generatedImages?.[0]?.image?.imageBytes) {
    const base64Image = data.generatedImages[0].image.imageBytes
    return `data:image/png;base64,${base64Image}`
  }

  throw new Error("Keine Bilddaten von Google AI erhalten")
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, modelId, platform, customSettings } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt ist erforderlich" }, { status: 400 })
    }

    // Get the selected model or default to social media model
    const model = modelId ? getModelById(modelId) : getSocialMediaModel()
    if (!model) {
      return NextResponse.json({ error: "Ungültiges Modell" }, { status: 400 })
    }

    // Enhance prompt for social media
    const enhancedPrompt = `${prompt}. Optimiert für Social Media: lebendige Farben, hoher Kontrast, professionelle Qualität, ansprechend und teilbar.`

    let imageUrl: string

    if (model.provider === "google") {
      // Google AI (Imagen)
      if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json({ error: "GOOGLE_AI_API_KEY nicht konfiguriert" }, { status: 500 })
      }

      // Map platform to Google aspect ratio
      const aspectRatioMap: Record<string, string> = {
        instagram_square: "1:1",
        instagram_story: "9:16",
        facebook_post: "16:9",
        twitter_post: "16:9",
        square: "1:1",
        landscape: "16:9",
        portrait: "9:16",
      }
      const aspectRatio = platform ? aspectRatioMap[platform] || "1:1" : model.defaultSettings.aspectRatio || "1:1"

      imageUrl = await generateWithGoogleAI(enhancedPrompt, model.modelId, aspectRatio)
    } else {
      // FAL AI
      if (!process.env.FAL_KEY) {
        return NextResponse.json({ error: "FAL_KEY nicht konfiguriert" }, { status: 500 })
      }

      // Determine image size based on platform
      const imageSize =
        platform && IMAGE_SIZES[platform as ImageSizeKey]
          ? IMAGE_SIZES[platform as ImageSizeKey]
          : model.defaultSettings.image_size || "square_hd"

      // Generate image using the selected model
      const result = await fal.subscribe(model.modelId, {
        input: {
          prompt: enhancedPrompt,
          image_size: imageSize,
          num_inference_steps: customSettings?.num_inference_steps || model.defaultSettings.num_inference_steps,
          guidance_scale: customSettings?.guidance_scale || model.defaultSettings.guidance_scale,
          num_images: 1,
          enable_safety_checker: model.defaultSettings.enable_safety_checker ?? true,
        },
      })

      // Handle different response structures from different models
      imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url

      if (!imageUrl) {
        console.error("[v0] No image generated from fal.ai")
        return NextResponse.json({ error: "Bild konnte nicht generiert werden" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      model: model.name,
      provider: model.provider,
      platform,
      prompt: enhancedPrompt,
    })
  } catch (error) {
    console.error("[v0] Error generating social media image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bildgenerierung fehlgeschlagen" },
      { status: 500 },
    )
  }
}
