import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("last_name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching contacts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(contacts || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    const contactData = {
      salutation: body.salutation || null,
      title: body.title || null,
      first_name: body.first_name || null,
      last_name: body.last_name,
      company: body.company || null,
      position: body.position || null,
      email: body.email || null,
      phone: body.phone || null,
      mobile: body.mobile || null,
      fax: body.fax || null,
      website: body.website || null,
      street: body.street || null,
      house_number: body.house_number || null,
      postal_code: body.postal_code || null,
      city: body.city || null,
      country: body.country || null,
      category: body.category || null,
      notes: body.notes || null,
      practice_id: practiceId,
      created_by: user.id,
    }

    const { data: contact, error } = await supabase.from("contacts").insert(contactData).select().single()

    if (error) {
      console.error("[v0] Error creating contact:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const { data: contact, error } = await supabase
      .from("contacts")
      .update({
        salutation: body.salutation || null,
        title: body.title || null,
        first_name: body.first_name || null,
        last_name: body.last_name,
        company: body.company || null,
        position: body.position || null,
        email: body.email || null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        fax: body.fax || null,
        website: body.website || null,
        street: body.street || null,
        house_number: body.house_number || null,
        postal_code: body.postal_code || null,
        city: body.city || null,
        country: body.country || null,
        category: body.category || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating contact:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("id")

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const { error } = await supabase
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting contact:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
