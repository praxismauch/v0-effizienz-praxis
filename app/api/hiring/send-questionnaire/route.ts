import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { candidateId, questionnaireId, practiceId, expiresInDays = 7 } = await request.json()

    // Get candidate and questionnaire details
    const [candidateResult, questionnaireResult] = await Promise.all([
      supabase.from("candidates").select("*").eq("id", candidateId).is("deleted_at", null).maybeSingle(),
      supabase.from("questionnaires").select("*").eq("id", questionnaireId).maybeSingle(),
    ])

    const { data: candidate, error: candidateError } = candidateResult
    const { data: questionnaire, error: questionnaireError } = questionnaireResult

    if (candidateError || questionnaireError) {
      return NextResponse.json({ error: candidateError?.message || questionnaireError?.message }, { status: 500 })
    }

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (!questionnaire) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    // Generate unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create questionnaire response entry
    const { data: response, error: responseError } = await supabase
      .from("questionnaire_responses")
      .insert({
        questionnaire_id: questionnaireId,
        candidate_id: candidateId,
        practice_id: practiceId,
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single()

    if (responseError) {
      // Check if table doesn't exist
      if (responseError.message.includes("does not exist") || responseError.code === "42P01") {
        console.error("[v0] questionnaire_responses table does not exist")
        return NextResponse.json(
          { error: "Questionnaire responses table not configured. Please contact administrator." },
          { status: 503 },
        )
      }
      throw responseError
    }

    // Generate questionnaire URL
    const questionnaireUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/questionnaire/${token}`

    const emailResult = await sendEmail({
      to: candidate.email,
      subject: `Fragebogen: ${questionnaire.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hallo ${candidate.first_name} ${candidate.last_name},</h2>
          <p>vielen Dank für Ihr Interesse an unserer Stelle. Wir würden Sie bitten, den folgenden Fragebogen auszufüllen:</p>
          <h3>${questionnaire.title}</h3>
          ${questionnaire.description ? `<p>${questionnaire.description}</p>` : ""}
          <p style="margin: 30px 0;">
            <a href="${questionnaireUrl}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Fragebogen ausfüllen
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Dieser Link ist gültig bis ${expiresAt.toLocaleDateString("de-DE")}.
          </p>
          <p style="color: #666; font-size: 14px;">
            Falls Sie Fragen haben, antworten Sie bitte auf diese E-Mail.
          </p>
        </div>
      `,
    })

    if (!emailResult.success) {
      console.error("Error sending email:", emailResult.error)
      throw new Error("Failed to send email: " + emailResult.error)
    }

    return NextResponse.json({ success: true, response, messageId: emailResult.messageId })
  } catch (error) {
    console.error("Error sending questionnaire:", error)
    return NextResponse.json({ error: "Failed to send questionnaire" }, { status: 500 })
  }
}
