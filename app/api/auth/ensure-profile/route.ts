import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("[v0] ensure-profile: Request received")
  try {
    const body = await request.json()
    const { userId, email, name, firstName, lastName } = body
    
    console.log("[v0] ensure-profile: Processing for", email, "userId:", userId)

    if (!userId || !email) {
      console.log("[v0] ensure-profile: Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: userId and email" },
        { status: 400 }
      )
    }

    // Verify the user is authenticated and matches the userId
    console.log("[v0] ensure-profile: Verifying auth...")
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] ensure-profile: Auth error:", authError.message)
      return NextResponse.json(
        { error: "Not authenticated", details: authError.message },
        { status: 401 }
      )
    }
    
    if (!authUser) {
      console.log("[v0] ensure-profile: No authenticated user")
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    console.log("[v0] ensure-profile: Auth verified for", authUser.email)

    if (authUser.id !== userId) {
      console.log("[v0] ensure-profile: User ID mismatch - expected:", userId, "got:", authUser.id)
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      )
    }

    // Use admin client to bypass RLS and check/create the profile
    console.log("[v0] ensure-profile: Getting admin client...")
    const adminClient = await createAdminClient()
    console.log("[v0] ensure-profile: Admin client obtained")

    // First check if profile already exists
    console.log("[v0] ensure-profile: Checking for existing profile...")
    const { data: existingProfile, error: checkError } = await adminClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.log("[v0] ensure-profile: Error checking profile:", checkError.message, checkError)
      return NextResponse.json(
        { error: "Database error checking profile", details: checkError.message },
        { status: 500 }
      )
    }

    if (existingProfile) {
      console.log("[v0] ensure-profile: Profile already exists for", email)
      return NextResponse.json({ user: existingProfile })
    }
    
    console.log("[v0] ensure-profile: No existing profile, creating new one...")

    // Get default practice_id (first active practice)
    const { data: defaultPractice } = await adminClient
      .from("practices")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    const defaultPracticeId = defaultPractice?.id || 1

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
        role: "doctor", // Default role
        practice_id: defaultPracticeId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.log("[v0] ensure-profile: Error creating profile:", insertError.message)
      
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
        { error: "Failed to create profile", details: insertError.message },
        { status: 500 }
      )
    }

    console.log("[v0] ensure-profile: Profile created successfully for", email)
    return NextResponse.json({ user: newProfile })

  } catch (error) {
    console.error("[v0] ensure-profile: Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
