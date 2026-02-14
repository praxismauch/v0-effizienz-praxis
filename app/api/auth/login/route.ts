import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { applyRateLimitRedis } from "@/lib/api/rate-limit-redis"
import Logger from "@/lib/logger"
import { sendEmail } from "@/lib/email/send-email"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const rateLimitResult = await applyRateLimitRedis(request, "auth")
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response
    }

    const { email, password } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = await createServerClient()

    Logger.info("auth", "Login attempt initiated")

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData?.user) {
      Logger.warn("auth", "Login failed - invalid credentials")
      return NextResponse.json(
        {
          error: "E-Mail oder Passwort ungültig",
        },
        { status: 401 },
      )
    }

    Logger.info("auth", "Login successful")

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, is_active, practice_id")
      .eq("id", authData.user.id)
      .maybeSingle()

    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name ?? authData.user.email!.split("@")[0],
          role: authData.user.user_metadata?.role ?? "user",
          is_active: true,
          practice_id: authData.user.user_metadata?.practice_id ?? null,
        })
        .select()
        .maybeSingle()

      if (createError || !newUser) {
        Logger.error("auth", "Failed to create user profile", createError)
        return NextResponse.json({ error: "Fehler beim Erstellen des Benutzerprofils" }, { status: 500 })
      }

      Logger.info("auth", "Created new user profile")

      // Notify super admins about new registration
      try {
        const { data: superAdmins } = await supabase
          .from("users")
          .select("email, name")
          .eq("role", "superadmin")
          .eq("is_active", true)

        if (superAdmins && superAdmins.length > 0) {
          const superAdminEmails = superAdmins.map((admin) => admin.email)

          await sendEmail({
            to: superAdminEmails,
            subject: "Neue Benutzerregistrierung - Effizienz Praxis",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Neue Benutzerregistrierung</h2>
                <p>Ein neuer Benutzer hat sich registriert und wartet auf Genehmigung:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>E-Mail:</strong> ${newUser.email}</p>
                  <p><strong>Name:</strong> ${newUser.name}</p>
                  <p><strong>Registriert am:</strong> ${new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <p>Bitte überprüfen und genehmigen Sie den neuen Benutzer in den Admin-Einstellungen.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  Diese E-Mail wurde automatisch vom Effizienz Praxis System gesendet.
                </p>
              </div>
            `,
          })

          Logger.info("auth", "Notification email sent to super admins")
        }
      } catch (emailError) {
        // Don't fail registration if email fails
        Logger.error("auth", "Failed to send notification email", emailError)
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            practiceId: newUser.practice_id,
            isActive: newUser.is_active,
            joinedAt: new Date().toISOString(),
          },
        },
        { status: 200 },
      )
    }

    if (userError) {
      Logger.error("auth", "Error loading user profile", userError)
      return NextResponse.json({ error: "Fehler beim Laden des Benutzerprofils" }, { status: 500 })
    }

    if (!userData.is_active) {
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error: "Ihr Konto wartet noch auf die Genehmigung durch einen Administrator.",
        },
        { status: 403 },
      )
    }

    Logger.info("auth", "Login completed successfully")

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          practiceId: userData.practice_id,
          isActive: userData.is_active,
          joinedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    Logger.error("auth", "Login error", error)
    return NextResponse.json(
      {
        error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      },
      { status: 500 },
    )
  }
}
