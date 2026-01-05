import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"
import { fal } from "@fal-ai/client"

// Configure fal client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  })
}

async function generateCompetitorImage(location: string, specialty: string): Promise<string | null> {
  if (!process.env.FAL_KEY) {
    return null
  }

  try {
    const cityName = location || "German city"
    const specialtyName = specialty || "medical practice"

    // Create unique prompts based on specialty
    const specialtyPrompts: Record<string, string> = {
      Allgemeinmedizin: "general practitioner family doctor office",
      "Innere Medizin": "internal medicine specialist clinic",
      Kardiologie: "cardiology heart center",
      Dermatologie: "dermatology skin clinic",
      Orthopädie: "orthopedic surgery center",
      Gynäkologie: "gynecology women's health center",
      Urologie: "urology medical center",
      HNO: "ENT ear nose throat clinic",
      Augenheilkunde: "ophthalmology eye clinic",
      Neurologie: "neurology brain specialist center",
      Psychiatrie: "psychiatry mental health clinic",
      Psychotherapie: "psychotherapy counseling center",
      Kinderheilkunde: "pediatric children's clinic",
      Chirurgie: "surgical center",
      Radiologie: "radiology imaging center",
      Zahnmedizin: "dental clinic",
      Kieferorthopädie: "orthodontics dental braces clinic",
      Physiotherapie: "physiotherapy rehabilitation center",
      Hausarztpraxis: "family medicine general practice",
      MVZ: "medical care center multi-specialty clinic",
    }

    const specialtyContext = specialtyPrompts[specialtyName] || `${specialtyName} medical clinic`

    const prompt = `Photorealistic exterior photograph of a modern ${specialtyContext} building in ${cityName}, Germany. Contemporary healthcare architecture with large windows, professional medical signage, clean entrance area, landscaped surroundings, sunny daytime lighting, high-end architectural photography style, 8k resolution`

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    })

    if (result.data?.images?.[0]?.url) {
      return result.data.images[0].url
    }

    return null
  } catch (error) {
    console.error("[v0] Error generating competitor image:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json([])
    }

    const supabase = await createAdminClient()

    const { data, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("competitor_analyses")
          .select("*")
          .eq("practice_id", String(practiceId))
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      [],
    )

    // Return empty array for any error
    if (error && error.code !== "RATE_LIMITED") {
      console.error("CompetitorAnalysis GET error:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("CompetitorAnalysis GET exception:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 500 })
    }

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const generatedImageUrl = await generateCompetitorImage(body.location, body.specialty)

    const newAnalysis = {
      practice_id: practiceId,
      created_by: createdBy,
      location: body.location,
      specialty: body.specialty,
      radius_km: body.radius_km || body.radiusKm || 10,
      additional_keywords: body.additional_keywords || body.additionalKeywords || [],
      title: body.title || `Konkurrenzanalyse ${body.location} - ${body.specialty}`,
      status: "draft",
      ai_analysis: generatedImageUrl
        ? {
            generated_image_url: generatedImageUrl,
            image_generated_at: new Date().toISOString(),
          }
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("competitor_analyses").insert(newAnalysis).select().single()

    if (error) {
      console.error("CompetitorAnalysis POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("CompetitorAnalysis POST exception:", error)
    return NextResponse.json({ error: "Analyse konnte nicht erstellt werden" }, { status: 500 })
  }
}
