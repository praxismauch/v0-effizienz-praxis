import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"
import Logger from "@/lib/logger"

// Practice admin can invite team members (requires super admin approval)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)

    // Check if user is practice admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userRecord || userRecord.role !== "praxisadmin") {
      return NextResponse.json(
        { error: "Nur Praxis-Administratoren können Teammitglieder einladen" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, role = "user" } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen: Email, Passwort, Vor- und Nachname erforderlich" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Will be confirmed after super admin approval
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (authError || !authData.user) {
      Logger.error("team-invite", "Error creating auth user", authError)
      return NextResponse.json(
        { error: `Benutzer konnte nicht erstellt werden: ${authError?.message}` },
        { status: 500 }
      )
    }

    const newUserId = authData.user.id

    // Step 2: Create user record with pending approval
    const { error: userError } = await supabase.from("users").insert({
      id: newUserId,
      email,
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      role,
      practice_id: practiceId,
      is_active: false,
      approval_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userError) {
      Logger.error("team-invite", "Error creating user record", userError)
      // Cleanup auth user
      await supabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { error: `Benutzerdatensatz konnte nicht erstellt werden: ${userError.message}` },
        { status: 500 }
      )
    }

    // Step 3: Create team member entry
    const { error: teamError } = await supabase.from("team_members").insert({
      user_id: newUserId,
      practice_id: practiceId,
      first_name: firstName,
      last_name: lastName,
      role,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (teamError) {
      Logger.warn("team-invite", "Error creating team member entry", teamError)
      // Non-fatal - continue
    }

    Logger.info("team-invite", "Team member invitation created", {
      practiceId,
      newUserId,
      invitedBy: user.id,
    })

    return NextResponse.json({
      success: true,
      message: "Teammitglied eingeladen. Ein Super-Admin muss die Einladung genehmigen.",
      userId: newUserId,
    })
  } catch (error) {
    Logger.error("team-invite", "Unexpected error", error)
    return NextResponse.json({ error: "Ein unerwarteter Fehler ist aufgetreten" }, { status: 500 })
  }
}
