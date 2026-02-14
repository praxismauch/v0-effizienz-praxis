import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { firstName, lastName, email, role = "user", teamName = "Extern" } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Vorname, Nachname und E-Mail sind erforderlich" }, { status: 400 })
    }

    if (!practiceId) {
      return NextResponse.json({ error: "Praxis-ID ist erforderlich" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Check if user has permission to invite (must be practiceadmin or superadmin)
    const adminClient = await createAdminClient()
    const { data: currentUserData, error: userError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || !currentUserData) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    if (!["superadmin", "practiceadmin"].includes(currentUserData.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung. Nur Praxis-Administratoren können externe Benutzer einladen." },
        { status: 403 },
      )
    }

    // Check if email already exists
    const { data: existingUser } = await adminClient.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" }, { status: 400 })
    }

    // Find or create the "Extern" team for this practice
    let externTeamId: string | null = null

    const { data: existingTeam } = await adminClient
      .from("teams")
      .select("id")
      .eq("practice_id", practiceId)
      .ilike("name", "extern")
      .single()

    if (existingTeam) {
      externTeamId = existingTeam.id
    } else {
      // Create the "Extern" team if it doesn't exist
      const { data: newTeam, error: teamError } = await adminClient
        .from("teams")
        .insert({
          name: "Extern",
          description: "Externe Benutzer mit eingeschränkten Rechten",
          color: "#06b6d4", // Cyan color for extern team
          practice_id: practiceId,
          is_active: true,
        })
        .select("id")
        .single()

      if (teamError) {
        console.error("Error creating Extern team:", teamError)
        return NextResponse.json({ error: "Fehler beim Erstellen der Extern-Gruppe" }, { status: 500 })
      }

      externTeamId = newTeam.id
    }

    // Generate a unique ID for the new user
    const newUserId = crypto.randomUUID()

    // Create the external user in the users table with pending approval status
    // practice_id is now TEXT (UUID format)
    const { error: createUserError } = await adminClient.from("users").insert({
      id: newUserId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      role: "user", // External users always get basic "user" role
      practice_id: String(practiceId),
      is_active: false, // Will be activated after they complete registration
      approval_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (createUserError) {
      console.error("Error creating user:", createUserError)
      return NextResponse.json({ error: "Fehler beim Erstellen des Benutzers" }, { status: 500 })
    }

    // Create team member entry with TEXT practice_id
    const { error: teamMemberError } = await adminClient.from("team_members").insert({
      id: crypto.randomUUID(),
      user_id: newUserId,
      practice_id: String(practiceId),
      first_name: firstName,
      last_name: lastName,
      role: "extern",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (teamMemberError) {
      console.error("Error creating team member:", teamMemberError)
      // Continue anyway, team member can be created later
    }

    // Assign user to the Extern team
    if (externTeamId) {
      const { error: assignError } = await adminClient.from("team_assignments").insert({
        id: crypto.randomUUID(),
        user_id: newUserId,
        team_id: externTeamId,
        assigned_at: new Date().toISOString(),
      })

      if (assignError) {
        console.error("Error assigning user to team:", assignError)
        // Continue anyway, assignment can be done later
      }
    }

    // Send invitation email
    try {
      const inviteResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          practiceId,
          role: "user",
          isExternal: true,
        }),
      })

      if (!inviteResponse.ok) {
        console.error("Failed to send invite email")
        // Don't fail the request, user is created but email not sent
      }
    } catch (emailError) {
      console.error("Error sending invite email:", emailError)
      // Don't fail the request, user is created but email not sent
    }

    return NextResponse.json({
      success: true,
      message: "Externer Benutzer wurde erfolgreich eingeladen",
      userId: newUserId,
      teamId: externTeamId,
    })
  } catch (error) {
    console.error("Error inviting external user:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
