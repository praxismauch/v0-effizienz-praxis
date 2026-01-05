import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json({ error: "Bitte geben Sie eine detailliertere Beschreibung ein." }, { status: 400 })
    }

    // Generate survey using AI
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `Du bist ein Experte für die Erstellung von Umfragen für medizinische Praxen in Deutschland. 
      Erstelle professionelle, präzise Umfragen basierend auf der Beschreibung des Benutzers.
      
      Antworte NUR mit einem validen JSON-Objekt im folgenden Format:
      {
        "title": "Umfragetitel",
        "description": "Kurze Beschreibung der Umfrage",
        "survey_type": "internal" oder "external" oder "anonymous",
        "target_audience": "all" oder "specific" oder "patients",
        "is_anonymous": true oder false,
        "questions": [
          {
            "question_text": "Die Frage",
            "question_type": "single_choice" oder "multiple_choice" oder "text" oder "rating" oder "scale" oder "yes_no",
            "is_required": true oder false,
            "options": ["Option 1", "Option 2"] (nur für choice-Fragen),
            "min_value": 1 (nur für scale),
            "max_value": 10 (nur für scale),
            "scale_labels": {"1": "Sehr schlecht", "10": "Sehr gut"} (optional für scale)
          }
        ]
      }
      
      Erstelle 5-10 relevante Fragen. Verwende verschiedene Fragetypen für eine interessante Umfrage.
      Alle Texte müssen auf Deutsch sein.`,
      prompt: `Erstelle eine Umfrage basierend auf dieser Beschreibung: ${prompt}`,
    })

    // Parse the AI response
    let surveyData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      surveyData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, text)
      return NextResponse.json({ error: "Die KI-Antwort konnte nicht verarbeitet werden." }, { status: 500 })
    }

    // Generate public token if needed
    const publicToken =
      surveyData.survey_type === "external" ||
      surveyData.survey_type === "anonymous" ||
      surveyData.target_audience === "patients"
        ? randomBytes(16).toString("hex")
        : null

    // Create the survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        practice_id: practiceId,
        title: surveyData.title,
        description: surveyData.description,
        survey_type: surveyData.survey_type || "internal",
        target_audience: surveyData.target_audience || "all",
        is_anonymous: surveyData.is_anonymous || false,
        public_token: publicToken,
        created_by: user.id,
        status: "draft",
      })
      .select()
      .single()

    if (surveyError) {
      console.error("Error creating survey:", surveyError)
      return NextResponse.json({ error: surveyError.message }, { status: 500 })
    }

    // Insert questions
    if (surveyData.questions && surveyData.questions.length > 0) {
      const questionsToInsert = surveyData.questions.map((q: any, index: number) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required ?? true,
        display_order: index,
        options: q.options || [],
        min_value: q.min_value,
        max_value: q.max_value,
        scale_labels: q.scale_labels,
      }))

      const { error: questionsError } = await supabase.from("survey_questions").insert(questionsToInsert)

      if (questionsError) {
        console.error("Error creating questions:", questionsError)
      }
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error in AI survey generation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
