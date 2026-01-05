import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { practiceId, responses, missionStatement, visionStatement, leitbildOneSentence, existingVersion } = body

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error: deactivateError } = await supabase
      .from("leitbild")
      .update({ is_active: false })
      .eq("practice_id", practiceId)

    if (deactivateError) {
      console.error("Error deactivating existing leitbilds:", deactivateError)
      throw deactivateError
    }

    const { data: existingVersions } = await supabase
      .from("leitbild")
      .select("version")
      .eq("practice_id", practiceId)
      .order("version", { ascending: false })
      .limit(1)

    const nextVersion = existingVersions && existingVersions.length > 0 ? (existingVersions[0].version || 0) + 1 : 1

    const { data, error } = await supabase
      .from("leitbild")
      .insert({
        practice_id: practiceId,
        questionnaire_responses: responses,
        mission_statement: missionStatement,
        vision_statement: visionStatement,
        leitbild_one_sentence: leitbildOneSentence,
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting leitbild:", error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error saving leitbild:", error)
    return NextResponse.json({ error: error.message || "Failed to save leitbild" }, { status: 500 })
  }
}
