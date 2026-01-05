import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Check if this is a safe environment to run seed
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Seed route is disabled in production" }, { status: 403 })
    }

    // Hash password using bcryptjs
    const hashedPassword = await bcryptjs.hash("admin123", 10)

    // Create super admin user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@effizienz-praxis.de",
      password: "admin123",
      email_confirm: true,
    })

    if (authError) {
      console.error("[v0] Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Create super admin profile
    const { error: profileError } = await supabase.from("super_admins").insert({
      id: authUser.user.id,
      email: "admin@effizienz-praxis.de",
      name: "System Administrator",
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("[v0] Error creating super admin profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      user: {
        email: "admin@effizienz-praxis.de",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("[v0] Seed error:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
