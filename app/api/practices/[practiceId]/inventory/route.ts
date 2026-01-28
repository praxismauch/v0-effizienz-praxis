import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

// GET - Fetch all inventory items for a practice
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { data, error } = await adminClient
      .from("inventory_items")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching inventory items:", error)
      return NextResponse.json({ error: "Fehler beim Laden der Bestandsdaten" }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create a new inventory item
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient, user } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    const { data, error } = await adminClient
      .from("inventory_items")
      .insert({
        ...body,
        practice_id: practiceId,
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
    return handleApiError(error)
  }
}

// PUT - Update an inventory item
export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Artikel-ID erforderlich" }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from("inventory_items")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating inventory item:", error)
      return NextResponse.json({ error: "Fehler beim Aktualisieren des Artikels" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Soft delete an inventory item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Artikel-ID erforderlich" }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await adminClient
      .from("inventory_items")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting inventory item:", error)
      return NextResponse.json({ error: "Fehler beim Löschen des Artikels" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
