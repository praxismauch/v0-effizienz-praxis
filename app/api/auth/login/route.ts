import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const cookieStore = await cookies()

    const cookiesToSetOnResponse: Array<{ name: string; value: string; options?: any }> = []

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToSetOnResponse.push({ name, value, options })
            // Also set on cookieStore for server-side reads
            try {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              })
            } catch {
              // Ignore - happens in read-only contexts
            }
          })
        },
      },
    })

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData?.user) {
      return NextResponse.json({ error: authError?.message || "Authentifizierung fehlgeschlagen" }, { status: 401 })
    }

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
        console.error("[auth/login] Failed to create user profile:", createError)
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }

      const response = NextResponse.json(
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

      // Apply all cookies that Supabase set during auth
      cookiesToSetOnResponse.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        })
      })

      console.log("[auth/login] Cookies set on response:", cookiesToSetOnResponse.map((c) => c.name).join(", "))

      return response
    }

    if (userError) {
      console.error("[auth/login] Error loading user:", userError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
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

    const successResponse = NextResponse.json(
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

    // Apply all cookies that Supabase set during auth
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      successResponse.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
    })

    console.log("[auth/login] Success - Cookies set:", cookiesToSetOnResponse.map((c) => c.name).join(", "))

    return successResponse
  } catch (error) {
    console.error("[auth/login] Error:", error)
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json({ error: `Ein unerwarteter Fehler ist aufgetreten: ${message}` }, { status: 500 })
  }
}
