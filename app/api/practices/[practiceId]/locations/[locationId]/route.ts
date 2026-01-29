import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch a single location
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string; locationId: string }> }) {
  try {
    const { practiceId, locationId } = await params

    if (!practiceId || !locationId) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: location, error } = await supabase
      .from("practice_locations")
      .select("*")
      .eq("id", locationId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      console.error("[v0] Error fetching location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error("[v0] Error in GET location:", error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}

// PUT - Update a location
export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; locationId: string }> }) {
  try {
    const { practiceId, locationId } = await params
    const body = await request.json()

    if (!practiceId || !locationId) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Map fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.street !== undefined) updateData.street = body.street
    if (body.city !== undefined) updateData.city = body.city
    if (body.zipCode !== undefined || body.zip_code !== undefined) {
      updateData.zip_code = body.zipCode || body.zip_code
    }
    if (body.country !== undefined) updateData.country = body.country
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.fax !== undefined) updateData.fax = body.fax
    if (body.website !== undefined) updateData.website = body.website
    if (body.isMain !== undefined || body.is_main !== undefined) {
      updateData.is_main = body.isMain ?? body.is_main
    }
    if (body.isActive !== undefined || body.is_active !== undefined) {
      updateData.is_active = body.isActive ?? body.is_active
    }
    if (body.openingHours !== undefined || body.opening_hours !== undefined) {
      updateData.opening_hours = body.openingHours || body.opening_hours
    }
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.latitude !== undefined) updateData.latitude = body.latitude
    if (body.longitude !== undefined) updateData.longitude = body.longitude

    const { data: location, error } = await supabase
      .from("practice_locations")
      .update(updateData)
      .eq("id", locationId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      location,
      message: "Location updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error in PUT location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

// DELETE - Delete a location
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string; locationId: string }> }) {
  try {
    const { practiceId, locationId } = await params

    if (!practiceId || !locationId) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check if this is the only location
    const { data: locations, error: countError } = await supabase
      .from("practice_locations")
      .select("id, is_main")
      .eq("practice_id", practiceId)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (locations && locations.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only location. A practice must have at least one location." },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from("practice_locations")
      .delete()
      .eq("id", locationId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Location deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error in DELETE location:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}

// PATCH - Set location as main
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string; locationId: string }> }) {
  try {
    const { practiceId, locationId } = await params

    if (!practiceId || !locationId) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // The trigger will handle unsetting other main locations
    const { data: location, error } = await supabase
      .from("practice_locations")
      .update({
        is_main: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", locationId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error setting main location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      location,
      message: "Main location updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error in PATCH location:", error)
    return NextResponse.json({ error: "Failed to set main location" }, { status: 500 })
  }
}
