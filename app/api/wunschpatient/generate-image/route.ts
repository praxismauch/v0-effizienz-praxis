import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { createAdminClient } from "@/lib/supabase/admin"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId, gender, age_range, occupation, archetype, lifestyle_factors } = body

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }

    // Build a detailed prompt for photorealistic patient image
    const genderText = gender === "female" ? "woman" : gender === "male" ? "man" : "person"
    const ageText = age_range || "35-45"
    const occupationText = occupation || "professional"

    // Map archetype to visual characteristics
    const archetypeDescriptions: Record<string, string> = {
      prevention: "health-conscious, active lifestyle, confident posture",
      chronic: "thoughtful expression, seeking care and understanding",
      performance: "athletic build, determined look, energetic",
      acute: "concerned expression, seeking immediate attention",
      relationship: "warm, friendly expression, trusting demeanor",
    }

    const archetypeDesc = archetypeDescriptions[archetype] || "friendly, approachable"

    // Build lifestyle context
    const lifestyleContext =
      Array.isArray(lifestyle_factors) && lifestyle_factors.length > 0 ? lifestyle_factors.slice(0, 3).join(", ") : ""

    const prompt = `Professional portrait photograph of a ${ageText} year old German ${genderText}, ${occupationText}, ${archetypeDesc}. ${lifestyleContext ? `Lifestyle: ${lifestyleContext}.` : ""} Natural lighting, medical practice waiting room background, warm and welcoming atmosphere, high quality DSLR photograph, sharp focus, professional headshot style, neutral background, looking at camera with a gentle smile. Photorealistic, 4k quality.`

    // Generate image using fal.ai flux schnell model
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }

    // Extract the image URL from the result
    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      console.error("[v0] No image generated from fal.ai")
      return NextResponse.json({ error: "No image generated" }, { status: 500 })
    }

    // Update the wunschpatient profile with the generated image URL
    const supabase = await createAdminClient()
    const { error: updateError } = await supabase
      .from("wunschpatient_profiles")
      .update({ ai_generated_image_url: imageUrl })
      .eq("id", profileId)

    if (updateError) {
      console.error("[v0] Error updating profile with image URL:", updateError)
      return NextResponse.json({ error: "Failed to save image URL" }, { status: 500 })
    }

    return NextResponse.json({ imageUrl, success: true })
  } catch (error) {
    console.error("[v0] Error generating wunschpatient image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
