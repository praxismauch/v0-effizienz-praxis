import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { applyRateLimitRedis } from "@/lib/api/rate-limit-redis"
import Logger from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const rateLimitResult = await applyRateLimitRedis(request, "auth")
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response
    }

    const { email, password } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
