import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, practice_name, practice_type, phone, message } = body

    if (!email) {
      return NextResponse.json({ error: "E-Mail-Adresse ist erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check for existing email
    const { data: existingEntry } = await supabase.from("waitlist").select("id").eq("email", email).maybeSingle()

    if (existingEntry) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
    }

    // Insert new entry
    const { data: waitlistEntry, error: insertError } = await supabase
      .from("waitlist")
      .insert({
        email,
        name: name || null,
        practice_name: practice_name || null,
        practice_type: practice_type || null,
        phone: phone || null,
        message: message || null,
        source: "coming_soon_page",
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
      }
      console.error("Waitlist insert error:", insertError)
      throw insertError
    }

    // No email sending in this route to avoid runtime compatibility issues

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich",
      id: waitlistEntry.id,
    })
  } catch (error) {
    console.error("Waitlist error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    )
  }
}
