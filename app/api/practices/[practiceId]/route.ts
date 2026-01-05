import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    if (practiceId === "count") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError)
      return NextResponse.json({ error: "Failed to create database client" }, { status: 500 })
    }

    const { data, error } = await supabase.from("practices").select("*").eq("id", String(practiceId)).maybeSingle()

    if (error) {
      console.error("Database error fetching practice:", error.message)
      return NextResponse.json({ error: "Failed to fetch practice", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    return NextResponse.json({ practice: data })
  } catch (error) {
    console.error("Unexpected error in GET /api/practices/[practiceId]:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const supabase = await createClient()
    const updates = await request.json()

    if (updates.isActive !== undefined) {
      const { data: currentPractice } = await supabase
        .from("practices")
        .select("settings")
        .eq("id", String(practiceId))
        .maybeSingle()

      const currentSettings = currentPractice?.settings || {}

      updates.settings = {
        ...currentSettings,
        isActive: updates.isActive,
      }

      delete updates.isActive
    }

    const { data, error } = await supabase
      .from("practices")
      .update(updates)
      .eq("id", String(practiceId))
      .select()
      .maybeSingle()

    if (error) {
      console.error("Failed to update practice:", error)
      return NextResponse.json({ error: "Failed to update practice" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    const responseData = {
      ...data,
      isActive: data.settings?.isActive !== undefined ? data.settings.isActive : true,
    }

    return NextResponse.json({ practice: responseData, message: "Practice updated successfully" })
  } catch (error) {
    console.error("Error in PUT /api/practices/[practiceId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    if (practiceId === "0" || practiceId === "default" || !practiceId || practiceId.trim() === "") {
      return NextResponse.json(
        {
          error: "Invalid practice ID",
          message: "Cannot delete system or invalid practice",
        },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const supabase = await createClient()

    const { data: jobPostings, error: jobPostingsError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("practice_id", String(practiceId))
      .limit(1)

    if (jobPostingsError) {
      console.error("Error checking job postings:", jobPostingsError)
    }

    if (jobPostings && jobPostings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete practice",
          message: "This practice has job postings. Please delete all job postings first.",
          code: "HAS_JOB_POSTINGS",
        },
        { status: 409, headers: { "Content-Type": "application/json" } },
      )
    }

    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("id")
      .eq("practice_id", String(practiceId))
      .limit(1)

    if (teamMembersError) {
      console.error("Error checking team members:", teamMembersError)
    }

    if (teamMembers && teamMembers.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete practice",
          message: "This practice has team members. Please remove all team members first.",
          code: "HAS_TEAM_MEMBERS",
        },
        { status: 409, headers: { "Content-Type": "application/json" } },
      )
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("practice_id", String(practiceId))
      .limit(1)

    if (usersError) {
      console.error("Error checking users:", usersError)
    }

    if (users && users.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete practice",
          message: "This practice has users assigned to it. Please reassign or remove all users first.",
          code: "HAS_USERS",
        },
        { status: 409, headers: { "Content-Type": "application/json" } },
      )
    }

    const { error } = await supabase.from("practices").delete().eq("id", String(practiceId))

    if (error) {
      console.error("Failed to delete practice:", error)
      return NextResponse.json(
        {
          error: "Failed to delete practice",
          message: error.message || "Database error occurred",
        },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    return NextResponse.json(
      { message: "Practice deleted successfully" },
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Error in DELETE /api/practices/[practiceId]:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
