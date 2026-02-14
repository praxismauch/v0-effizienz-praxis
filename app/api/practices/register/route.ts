import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import Logger from "@/lib/logger"

// Public endpoint for practice self-registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Practice info
      name,
      type,
      street,
      city,
      zipCode,
      phone,
      email,
      website,
      
      // Admin user info
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
    } = body

    // Validation
    if (!name || !type || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen: Praxisname, Typ, Admin-Email, Passwort, Vor- und Nachname erforderlich" },
        { status: 400 }
      )
    }

    if (adminPassword.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen lang sein" }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    // Step 1: Create auth user for practice admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: false, // Will be confirmed after super admin approval
      user_metadata: {
        first_name: adminFirstName,
        last_name: adminLastName,
      },
    })

    if (authError || !authData.user) {
      Logger.error("practice-register", "Error creating auth user", authError)
      return NextResponse.json(
        { error: `Benutzer konnte nicht erstellt werden: ${authError?.message}` },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Step 2: Create practice with pending status
    const address = [street, city, zipCode].filter(Boolean).join(", ")
    
    const { data: practice, error: practiceError } = await supabaseAdmin
      .from("practices")
      .insert({
        name,
        type,
        address,
        phone: phone || "",
        email: email || adminEmail,
        website: website || "",
        timezone: "Europe/Berlin",
        currency: "EUR",
        approval_status: "pending",
        created_by: userId,
        settings: {
          isActive: false, // Inactive until approved
        },
      })
      .select()
      .single()

    if (practiceError || !practice) {
      Logger.error("practice-register", "Error creating practice", practiceError)
      // Cleanup auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Praxis konnte nicht erstellt werden: ${practiceError?.message}` },
        { status: 500 }
      )
    }

    // Step 3: Create user record with pending approval
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: adminEmail,
      name: `${adminFirstName} ${adminLastName}`,
      first_name: adminFirstName,
      last_name: adminLastName,
      role: "praxisadmin",
      practice_id: practice.id,
      is_active: false, // Inactive until approved
      approval_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userError) {
      Logger.error("practice-register", "Error creating user record", userError)
      // Cleanup practice and auth user
      await supabaseAdmin.from("practices").delete().eq("id", practice.id)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Benutzerdatensatz konnte nicht erstellt werden: ${userError.message}` },
        { status: 500 }
      )
    }

    // Step 4: Create team member entry
    const { error: teamError } = await supabaseAdmin.from("team_members").insert({
      user_id: userId,
      practice_id: practice.id,
      first_name: adminFirstName,
      last_name: adminLastName,
      role: "praxisadmin",
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (teamError) {
      Logger.warn("practice-register", "Error creating team member entry", teamError)
      // Non-fatal - continue with registration
    }

    Logger.info("practice-register", "Practice registration submitted", {
      practiceId: practice.id,
      userId,
      email: adminEmail,
    })

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich eingereicht. Ein Administrator wird Ihre Anfrage prüfen.",
      practiceId: practice.id,
    })
  } catch (error) {
    Logger.error("practice-register", "Unexpected error during practice registration", error)
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
