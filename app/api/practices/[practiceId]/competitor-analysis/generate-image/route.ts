import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { fal } from "@fal-ai/client"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { analysisId, location, specialty } = body

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY nicht konfiguriert" }, { status: 500 })
    }

    if (!analysisId) {
      return NextResponse.json({ error: "analysisId ist erforderlich" }, { status: 400 })
    }

    // Build a photorealistic prompt based on location and specialty
    const cityName = location || "German city"
    const specialtyName = specialty || "medical practice"

    // Map German specialties to English for better image generation
    const specialtyMap: Record<string, string> = {
      "Allgemeinmedizin": "general medicine family practice",
      "Innere Medizin": "internal medicine",
      "Kardiologie": "cardiology heart clinic",
      "Orthopädie": "orthopedic clinic",
      "Dermatologie": "dermatology skin clinic",
      "Gynäkologie": "gynecology womens health",
      "Pädiatrie": "pediatric childrens clinic",
      "Zahnmedizin": "dental practice",
      "Augenheilkunde": "ophthalmology eye clinic",
      "HNO": "ENT ear nose throat clinic",
      "Neurologie": "neurology clinic",
      "Psychiatrie": "psychiatry mental health",
      "Urologie": "urology clinic",
      "Chirurgie": "surgery clinic",
    }

    // Try to match specialty
    let englishSpecialty = "healthcare medical"
    for (const [de, en] of Object.entries(specialtyMap)) {
      if (specialtyName.toLowerCase().includes(de.toLowerCase())) {
        englishSpecialty = en
        break
      }
    }

    // Create a prompt that avoids text generation (which causes garbled artifacts)
    const prompt = `Aerial drone photograph of a modern medical clinic building in a small German city, ${englishSpecialty} facility, contemporary European architecture with white and glass facade, surrounded by green trees and parking area, warm golden hour sunlight, no text no letters no words no signs no logos, clean minimalist design, professional architectural photography, sharp focus, 8k ultra high resolution`

    // Generate image using fal.ai flux/schnell
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    })

    if (!result.data?.images?.[0]?.url) {
      console.error("[v0] No image generated from fal.ai")
      return NextResponse.json({ error: "Bild konnte nicht generiert werden" }, { status: 500 })
    }

    const imageUrl = result.data.images[0].url
    console.log("[v0] Generated image URL:", imageUrl)

    // Update the competitor analysis with the generated image
    const supabase = await createAdminClient()

    // First get the current ai_analysis
    const { data: currentAnalysis, error: fetchError } = await supabase
      .from("competitor_analyses")
      .select("ai_analysis")
      .eq("id", analysisId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching analysis:", fetchError)
      return NextResponse.json({ error: "Analyse nicht gefunden" }, { status: 404 })
    }

    // Merge the image URL into ai_analysis
    const updatedAiAnalysis = {
      ...(currentAnalysis?.ai_analysis || {}),
      generated_image_url: imageUrl,
      image_generated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("competitor_analyses")
      .update({
        ai_analysis: updatedAiAnalysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId)
      .eq("practice_id", practiceId)

    if (updateError) {
      console.error("[v0] Error updating analysis with image:", updateError)
      return NextResponse.json({ error: "Bild konnte nicht gespeichert werden" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Bild wurde erfolgreich generiert",
    })
  } catch (error: any) {
    console.error("[v0] Error generating competitor image:", error)
    return NextResponse.json({ error: error.message || "Fehler bei der Bildgenerierung" }, { status: 500 })
  }
}
