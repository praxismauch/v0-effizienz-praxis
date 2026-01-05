import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch all inventory items for a practice
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("practice_id", Number.parseInt(practiceId))
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching inventory items:", error)
      return NextResponse.json({ error: "Fehler beim Laden der Bestandsdaten" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Inventory GET error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// POST - Create a new inventory item
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        ...body,
        practice_id: Number.parseInt(practiceId),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating inventory item:", error)
      return NextResponse.json({ error: "Fehler beim Erstellen des Artikels" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Inventory POST error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// PUT - Update an inventory item
export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { id, ...updateData } = body
    const supabase = await createClient()

    if (!id) {
      return NextResponse.json({ error: "Artikel-ID erforderlich" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", Number.parseInt(practiceId))
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating inventory item:", error)
      return NextResponse.json({ error: "Fehler beim Aktualisieren des Artikels" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Inventory PUT error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// DELETE - Soft delete an inventory item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const supabase = await createClient()

    if (!id) {
      return NextResponse.json({ error: "Artikel-ID erforderlich" }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("inventory_items")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", Number.parseInt(practiceId))

    if (error) {
      console.error("[v0] Error deleting inventory item:", error)
      return NextResponse.json({ error: "Fehler beim Löschen des Artikels" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Inventory DELETE error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
