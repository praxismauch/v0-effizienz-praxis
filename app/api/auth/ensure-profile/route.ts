import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, name, firstName, lastName } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId and email" },
        { status: 400 }
      )
    }

    // Verify the user is authenticated and matches the userId
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json(
        { error: "Not authenticated", details: authError.message },
        { status: 401 }
      )
    }
    
    if (!authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    if (authUser.id !== userId) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      )
    }

    // Use admin client to bypass RLS and check/create the profile
    const adminClient = await createAdminClient()

    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await adminClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json(
        { error: "Database error checking profile", details: checkError.message },
        { status: 500 }
      )
    }

    if (existingProfile) {
      return NextResponse.json({ user: existingProfile })
    }

    // Get default practice_id (first active practice)
    const { data: defaultPractice } = await adminClient
      .from("practices")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    const defaultPracticeId = defaultPractice?.id || null

    // Create the profile
    const displayName = name || `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0]
    
    const { data: newProfile, error: insertError } = await adminClient
      .from("users")
      .insert({
        id: userId,
        email: email,
        name: displayName,
        first_name: firstName || null,
        last_name: lastName || null,
        role: "user", // Default role - user is the standard role in database
        practice_id: defaultPracticeId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating user profile:", insertError)
      console.error("[v0] Insert error details:", { code: insertError.code, message: insertError.message, details: insertError.details })
      
      // Check if it's a unique constraint violation (profile was created by another request)
      if (insertError.code === "23505") {
        const { data: retryProfile } = await adminClient
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()
        
        if (retryProfile) {
          return NextResponse.json({ user: retryProfile })
        }
      }
      
      return NextResponse.json(
        { error: "Failed to create profile", details: insertError.message, code: insertError.code },
        { status: 500 }
      )
    }

    // Also create team_members entry for the user in the practice
    if (newProfile && defaultPracticeId) {
      const { error: teamMemberError } = await adminClient
        .from("team_members")
        .insert({
          practice_id: defaultPracticeId,
          user_id: userId,
          first_name: firstName || displayName.split(" ")[0] || "",
          last_name: lastName || displayName.split(" ").slice(1).join(" ") || "",
          email: email,
          role: "user",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (teamMemberError) {
        console.error("[v0] Error creating team member entry:", teamMemberError)
        // Don't fail the whole request - user profile was created successfully
      }
    }

    return NextResponse.json({ user: newProfile })

  } catch (error) {
    console.error("ensure-profile: Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
