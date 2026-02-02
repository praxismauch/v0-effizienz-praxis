import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const [
      skillsResult,
      workflowsResult,
      checklistsResult,
      documentsResult,
      teamsResult,
      eventTypesResult,
    ] = await Promise.all([
      supabase
        .from("global_skills")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("global_workflows")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("global_checklists")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("global_documents")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("global_teams")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("global_event_types")
        .select("*", { count: "exact", head: true }),
    ])

    return NextResponse.json({
      skills: skillsResult.count || 0,
      workflows: workflowsResult.count || 0,
      checklists: checklistsResult.count || 0,
      documents: documentsResult.count || 0,
      teams: teamsResult.count || 0,
      eventTypes: eventTypesResult.count || 0,
    })
  } catch (error) {
    console.error("Error loading content counts:", error)
    return NextResponse.json({
      skills: 0,
      workflows: 0,
      checklists: 0,
      documents: 0,
      teams: 0,
      eventTypes: 0,
    })
  }
}
