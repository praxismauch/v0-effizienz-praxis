import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import * as fal from "@fal-ai/serverless-client"

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

    // Build a photorealistic prompt based on actual location and specialty
    const cityName = location || "German city"
    const specialtyName = specialty || "medical practice"

    // Map German specialties to English visual descriptions
    const specialtyMap: Record<string, { english: string, visual: string }> = {
      "Allgemeinmedizin": { english: "general practice", visual: "warm welcoming family doctor office with a cozy waiting room" },
      "Innere Medizin": { english: "internal medicine", visual: "modern internal medicine clinic with diagnostic equipment" },
      "Kardiologie": { english: "cardiology", visual: "high-tech cardiology center with heart monitors" },
      "Orthopädie": { english: "orthopedics", visual: "bright orthopedic rehabilitation clinic with exercise equipment" },
      "Dermatologie": { english: "dermatology", visual: "clean bright dermatology clinic with modern treatment rooms" },
      "Gynäkologie": { english: "gynecology", visual: "modern womens health clinic with soft pastel interior" },
      "Pädiatrie": { english: "pediatrics", visual: "colorful friendly childrens medical practice" },
      "Kinderheilkunde": { english: "pediatrics", visual: "colorful friendly childrens medical practice" },
      "Zahnmedizin": { english: "dentistry", visual: "sleek modern dental practice with treatment chairs" },
      "Kieferorthopädie": { english: "orthodontics", visual: "modern orthodontic practice with bright interior" },
      "Augenheilkunde": { english: "ophthalmology", visual: "high-tech eye clinic with advanced diagnostic equipment" },
      "HNO": { english: "ENT", visual: "ear nose and throat specialist clinic" },
      "Neurologie": { english: "neurology", visual: "neurology center with brain imaging technology" },
      "Psychiatrie": { english: "psychiatry", visual: "calm peaceful mental health clinic with natural light" },
      "Psychotherapie": { english: "psychotherapy", visual: "comfortable psychotherapy practice with relaxing interior" },
      "Urologie": { english: "urology", visual: "modern urology clinic" },
      "Chirurgie": { english: "surgery", visual: "surgical center with operating room" },
      "Radiologie": { english: "radiology", visual: "radiology center with MRI and CT scanners" },
      "Physiotherapie": { english: "physiotherapy", visual: "bright physiotherapy practice with exercise equipment" },
      "Hausarztpraxis": { english: "family medicine", visual: "welcoming family doctor office in a traditional building" },
      "MVZ": { english: "multi-specialty medical center", visual: "large modern multi-specialty medical center" },
    }

    // Match specialties (can be comma-separated)
    const specialties = specialtyName.split(",").map((s: string) => s.trim())
    let matchedVisual = "modern medical practice building"
    let matchedEnglish = "medical practice"
    for (const spec of specialties) {
      for (const [de, info] of Object.entries(specialtyMap)) {
        if (spec.toLowerCase().includes(de.toLowerCase())) {
          matchedVisual = info.visual
          matchedEnglish = info.english
          break
        }
      }
    }

    // Determine regional character based on city name
    const isSmallTown = cityName.length > 0
    const regionHint = `in the Bavarian town of ${cityName}` // Default to Bavarian since practice is in Marktoberdorf area

    // Create a rich, location-specific prompt
    const prompt = `Professional photograph of a ${matchedVisual} ${regionHint}, Germany. The building has a modern European architectural style with large windows, set against a backdrop of the local townscape with traditional German buildings and green Alps foothills visible in the distance. Golden hour warm sunlight, autumn trees nearby, clean sidewalk with flower boxes. No text no letters no words no signs no logos no watermarks. Photorealistic architectural photography, shallow depth of field, 8k resolution`

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

    const images = (result as any).images || (result as any).data?.images
    if (!images?.[0]?.url) {
      console.error("[v0] No image generated from fal.ai")
      return NextResponse.json({ error: "Bild konnte nicht generiert werden" }, { status: 500 })
    }

    const imageUrl = images[0].url
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
