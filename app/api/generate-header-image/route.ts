import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

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

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Nur für Super Admins" }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, title, metrics } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt ist erforderlich" }, { status: 400 })
    }

    // Enhance prompt with German context and metrics
    const enhancedPrompt = `${prompt}. High quality, professional, modern software interface design for German medical practice management system called "Effizienz Praxis". ${title ? `Title: ${title}.` : ""} ${metrics?.length ? `Key metrics displayed: ${metrics.join(", ")}.` : ""}`

    // Generate image using fal.ai FLUX Pro
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: enhancedPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    })

    if (!result.data?.images?.[0]?.url) {
      throw new Error("Keine Bild-URL in der Antwort")
    }

    const imageUrl = result.data.images[0].url

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
    })
  } catch (error) {
    console.error("[v0] Error generating header image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bildgenerierung fehlgeschlagen" },
      { status: 500 },
    )
  }
}
