import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)

    const body = await request.json()
    const { contacts } = body

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "contacts array is required" }, { status: 400 })
    }

    const contactsToInsert = contacts.map((contact: any) => ({
      last_name: contact.last_name || contact.name || "Unbekannt",
      first_name: contact.first_name || null,
      company: contact.company || null,
      email: contact.email || null,
      phone: contact.phone || null,
      street: contact.street || null,
      city: contact.city || null,
      postal_code: contact.postal_code || null,
      category: contact.category || null,
      notes: contact.notes || null,
      ai_extracted: contact.ai_extracted || false,
      practice_id: practiceId,
      created_by: user.id,
    }))

    const { data, error } = await supabase.from("contacts").insert(contactsToInsert).select()

    if (error) {
      console.error("[v0] Error batch creating contacts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contacts: data, count: data?.length || 0 }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
