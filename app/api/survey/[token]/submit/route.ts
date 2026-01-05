import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

async function sendAdminNotification(survey: any, practice: any, respondentInfo: { name?: string; email?: string }) {
  try {
    const adminClient = await createAdminClient()

    // Get super admins for this practice
    const { data: admins } = await adminClient
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("practice_id", survey.practice_id)
      .eq("role", "super_admin")
      .eq("is_active", true)

    if (!admins || admins.length === 0) return

    // Send email to each admin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"

    for (const admin of admins) {
      if (!admin.email) continue

      try {
        await fetch(`${baseUrl}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: admin.email,
            subject: `Neue Umfrage-Antwort: ${survey.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Neue Umfrage-Antwort eingegangen</h2>
                <p>Hallo ${admin.first_name || "Admin"},</p>
                <p>Es wurde eine neue Antwort für die Umfrage "<strong>${survey.title}</strong>" abgegeben.</p>
                ${respondentInfo.name ? `<p><strong>Teilnehmer:</strong> ${respondentInfo.name}</p>` : ""}
                ${respondentInfo.email ? `<p><strong>E-Mail:</strong> ${respondentInfo.email}</p>` : ""}
                ${survey.is_anonymous ? "<p><em>Diese Umfrage ist anonym.</em></p>" : ""}
                <p style="margin-top: 20px;">
                  <a href="${baseUrl}/surveys?id=${survey.id}" 
                     style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ergebnisse ansehen
                  </a>
                </p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  Diese E-Mail wurde automatisch von Effizienz Praxis gesendet.
                </p>
              </div>
            `,
          }),
        })
      } catch (emailError) {
        console.error("Error sending admin notification email:", emailError)
      }
    }
  } catch (error) {
    console.error("Error in sendAdminNotification:", error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { answers, respondent_name, respondent_email } = body

    // Get the survey with notify_admin setting
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("id, practice_id, is_anonymous, status, title, notify_admin_on_response")
      .eq("public_token", token)
      .is("deleted_at", null)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (survey.status !== "active") {
      return NextResponse.json({ error: "Survey is not active" }, { status: 400 })
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create the response
    const { data: response, error: responseError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: survey.id,
        practice_id: survey.practice_id,
        respondent_name: survey.is_anonymous ? null : respondent_name,
        respondent_email: survey.is_anonymous ? null : respondent_email,
        is_anonymous: survey.is_anonymous,
        status: "completed",
        completed_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (responseError) {
      console.error("Error creating response:", responseError)
      return NextResponse.json({ error: responseError.message }, { status: 500 })
    }

    // Create individual answers
    const answerRecords = Object.entries(answers).map(([questionId, value]) => ({
      response_id: response.id,
      question_id: questionId,
      answer_text: typeof value === "string" ? value : null,
      answer_value: typeof value === "number" ? value : null,
      answer_options: Array.isArray(value) ? value : typeof value === "boolean" ? [String(value)] : null,
    }))

    if (answerRecords.length > 0) {
      const { error: answersError } = await supabase.from("survey_answers").insert(answerRecords)

      if (answersError) {
        console.error("Error creating answers:", answersError)
      }
    }

    // Update response count
    await supabase.rpc("increment_survey_response_count", { survey_id: survey.id })

    if (survey.notify_admin_on_response) {
      const adminClient = await createAdminClient()
      const { data: practice } = await adminClient
        .from("practices")
        .select("id, name")
        .eq("id", survey.practice_id)
        .single()

      sendAdminNotification(survey, practice, {
        name: respondent_name,
        email: respondent_email,
      })
    }

    return NextResponse.json({ success: true, response_id: response.id })
  } catch (error) {
    console.error("Error submitting survey:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
