import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const candidateId = params.id

    if (!candidateId || candidateId === "undefined" || candidateId === "") {
      console.error("Invalid candidate ID:", candidateId)
      return NextResponse.json(
        { error: "Invalid candidate ID" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const body = await request.json()
    const { practiceId, role, department, status, joined_date, notes } = body

    if (!practiceId || practiceId === "undefined" || practiceId === "") {
      console.error("Invalid practice ID:", practiceId)
      return NextResponse.json(
        { error: "Invalid practice ID" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const supabase = await createAdminClient()

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .eq("practice_id", practiceId)
      .single()

    if (candidateError || !candidate) {
      console.error("Candidate error:", candidateError)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404, headers: { "Content-Type": "application/json" } },
      )
    }

    const teamMemberId = crypto.randomUUID()

    const { error: teamMemberError } = await supabase.from("team_members").insert({
      id: teamMemberId,
      user_id: null,
      practice_id: practiceId,
      role: role,
      department: department || null,
      status: status,
      joined_date: joined_date,
      candidate_id: candidateId,
    })

    if (teamMemberError) {
      console.error("Team member error:", teamMemberError)
      return NextResponse.json(
        { error: "Failed to create team member" },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    await supabase
      .from("candidates")
      .update({
        status: "archived",
        notes: notes || `Konvertiert zu Team-Mitglied am ${new Date().toLocaleDateString("de-DE")}`,
      })
      .eq("id", candidateId)

    return NextResponse.json(
      { success: true, message: "Candidate converted successfully", teamMemberId },
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Convert to team error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
