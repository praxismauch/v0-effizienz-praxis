import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export interface PracticeLocation {
  id: string
  practice_id: number
  name: string
  street: string | null
  city: string | null
  zip_code: string | null
  country: string
  phone: string | null
  email: string | null
  fax: string | null
  website: string | null
  is_main: boolean
  is_active: boolean
  opening_hours: Record<string, any>
  notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

// GET - Fetch all locations for a practice
export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: locations, error } = await supabase
      .from("practice_locations")
      .select("*")
      .eq("practice_id", practiceId)
      .order("is_main", { ascending: false })
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching practice locations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ locations: locations || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/practices/[practiceId]/locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

// POST - Create a new location
export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const locationData = {
      practice_id: Number.parseInt(practiceId),
      name: body.name,
      street: body.street || null,
      city: body.city || null,
      zip_code: body.zipCode || body.zip_code || null,
      country: body.country || "Deutschland",
      phone: body.phone || null,
      email: body.email || null,
      fax: body.fax || null,
      website: body.website || null,
      is_main: body.isMain || body.is_main || false,
      is_active: body.isActive !== false,
      opening_hours: body.openingHours || body.opening_hours || {},
      notes: body.notes || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      created_by: user?.id || null,
    }

    const { data: location, error } = await supabase.from("practice_locations").insert(locationData).select().single()

    if (error) {
      console.error("[v0] Error creating practice location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      location,
      message: "Location created successfully",
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/practices/[practiceId]/locations:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
