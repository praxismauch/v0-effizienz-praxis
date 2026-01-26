import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    // Multiple layers of protection for seed route
    const isProduction = process.env.NODE_ENV === "production"
    const isVercelProduction = process.env.VERCEL_ENV === "production"
    const seedEnabled = process.env.ENABLE_SEED_ROUTE === "true"
    
    // Block in any production environment
    if (isProduction || isVercelProduction) {
      return NextResponse.json({ error: "Seed route is disabled in production" }, { status: 403 })
    }
    
    // Require explicit enable flag even in development
    if (!seedEnabled) {
      return NextResponse.json({ 
        error: "Seed route is disabled. Set ENABLE_SEED_ROUTE=true to enable." 
      }, { status: 403 })
    }
    
    // Only allow from localhost in development
    const host = request.headers.get("host") || ""
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Seed route only accessible from localhost" }, { status: 403 })
    }
    
    const supabase = await createAdminClient()

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
