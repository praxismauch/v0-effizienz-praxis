import { generateText } from "ai"
import { NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] Generate profile request body:", body)

    const prompt = `Du bist ein Experte für Praxismarketing und Patientenprofilierung für medizinische Praxen in Deutschland.

Erstelle basierend auf den folgenden Eingaben ein detailliertes Wunschpatienten-Profil:

**Eingabedaten:**
- Name/Bezeichnung: ${body.name}
- Altersspanne: ${body.age_range}
- Geschlecht: ${body.gender === "female" ? "weiblich" : body.gender === "male" ? "männlich" : "divers"}
- Beruf: ${body.occupation || "Nicht angegeben"}
- Familienstatus: ${body.family_status || "Nicht angegeben"}
- Archetyp: ${body.archetype}
- Gesundheitsthemen: ${body.health_concerns?.join(", ") || "Nicht angegeben"}
- Lebensstilfaktoren: ${body.lifestyle_factors?.join(", ") || "Nicht angegeben"}
- Werte: ${body.values?.join(", ") || "Nicht angegeben"}
- Erwartungen: ${body.expectations?.join(", ") || "Nicht angegeben"}
- Gesundheitsbewusstsein: ${body.health_consciousness || "Nicht angegeben"}
- Prävention vs. Akut: ${body.prevention_vs_acute || "Nicht angegeben"}
- Kommunikationspräferenz: ${body.communication_preference || "Nicht angegeben"}
- Finanzielle Bereitschaft: ${body.financial_willingness || "Nicht angegeben"}
- Wohngebiet: ${body.location_area || "Nicht angegeben"}

Erstelle folgende Inhalte auf Deutsch:

1. **PATIENT_STORY**: Eine kurze, persönliche Geschichte (3-5 Sätze) über diese Person. Verwende KEINE echten Namen (DSGVO). Schreibe stattdessen in der dritten Person ohne Namen (z.B. "Diese Person...", "Der/Die Patient/in..."). Beschreibe, warum diese Person eine Arztpraxis sucht, was sie im Alltag beschäftigt und was ihr bei der Gesundheitsversorgung besonders wichtig ist. Die Geschichte soll sich wie ein echter Mensch anfühlen.

2. **PERSONA_DESCRIPTION**: Eine lebendige, detaillierte Beschreibung dieser Person (2-3 Absätze). Beschreibe den typischen Tagesablauf, Motivationen, Ängste und Wünsche bezüglich Gesundheit.

3. **MARKETING_STRATEGY**: Konkrete Marketingstrategien, um diese Person anzusprechen (3-5 Punkte). Welche Kanäle, welche Botschaften, welche Touchpoints?

4. **COMMUNICATION_TIPS**: Spezifische Tipps für die Kommunikation mit diesem Patiententyp (3-5 Tipps). Wie sollte das Praxisteam kommunizieren?

5. **SERVICE_RECOMMENDATIONS**: 5-7 konkrete Leistungen/Services, die diese Praxis anbieten sollte, um diesen Wunschpatienten anzuziehen.

Formatiere deine Antwort IMMER als valides JSON mit den Feldern: patient_story, persona_description, marketing_strategy, communication_tips, service_recommendations (als Array von Strings).
Gib NUR das JSON zurück, ohne zusätzlichen Text.`

    console.log("[v0] Calling AI model...")

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
    })

    console.log("[v0] AI response received, length:", text.length)

    // Parse the response
    let parsedResponse
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
        console.log("[v0] Successfully parsed AI response")
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.log("[v0] Parse error, using fallback:", parseError)
      // Fallback: create structured response from text
      parsedResponse = {
        patient_story: "",
        persona_description: text.slice(0, 500),
        marketing_strategy: "Digitale Präsenz stärken, Social Media nutzen, persönliche Ansprache betonen.",
        communication_tips: "Empathisch kommunizieren, Zeit nehmen, digitale Optionen anbieten.",
        service_recommendations: ["Check-up Programme", "Präventionsberatung", "Online-Terminbuchung"],
      }
    }

    let imageUrl = ""
    try {
      // Build a detailed prompt for photorealistic portrait generation
      const genderWord = body.gender === "female" ? "woman" : body.gender === "male" ? "man" : "person"
      const genderWordDe = body.gender === "female" ? "Frau" : body.gender === "male" ? "Mann" : "Person"

      // Extract age estimate from range
      const ageMap: Record<string, string> = {
        "18-25": "early twenties",
        "26-35": "early thirties",
        "36-45": "early forties",
        "46-55": "early fifties",
        "56-65": "late fifties",
        "65+": "mid sixties",
      }
      const ageDescription = ageMap[body.age_range] || "middle-aged"

      // Map archetype to personality traits for image
      const archetypeTraits: Record<string, string> = {
        prevention: "health-conscious, active lifestyle, confident smile",
        chronic: "warm, patient, gentle expression",
        performance: "dynamic, ambitious, professional appearance",
        acute: "alert, attentive, concerned but hopeful",
        relationship: "friendly, approachable, trusting smile",
      }
      const traits = archetypeTraits[body.archetype] || "friendly, approachable"

      // Build professional occupation context
      const occupationContext = body.occupation ? `working as ${body.occupation}` : "professional"

      const imagePrompt = `Professional headshot portrait photograph of a ${ageDescription} ${genderWord}, ${occupationContext}, ${traits}. Natural lighting, clean background, high quality DSLR photography, sharp focus on face, warm and inviting expression, looking at camera. Photorealistic, professional portrait photography style.`

      console.log("[v0] Generating image with fal AI, prompt:", imagePrompt)

      const result = (await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: imagePrompt,
          image_size: "square_hd",
          num_inference_steps: 4,
          num_images: 1,
        },
      })) as { images?: { url: string }[] }

      imageUrl = result.images?.[0]?.url || ""

      if (imageUrl) {
        console.log("[v0] Successfully generated image:", imageUrl)
      } else {
        console.log("[v0] No image URL in response")
      }
    } catch (imageError) {
      console.error("[v0] Error generating image with fal:", imageError)
      // Fallback to placeholder if image generation fails
      const genderWord = body.gender === "female" ? "woman" : body.gender === "male" ? "man" : "person"
      const imageQuery = `professional ${genderWord} ${body.age_range} years old ${body.occupation || "professional"} portrait photo friendly medical patient`
      imageUrl = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(imageQuery)}`
    }

    console.log("[v0] Returning profile with image URL:", imageUrl)

    return NextResponse.json({
      ...parsedResponse,
      ai_generated_image_url: imageUrl,
    })
  } catch (error) {
    console.error("[v0] Error generating wunschpatient profile:", error)
    return NextResponse.json(
      {
        error: "Failed to generate profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
