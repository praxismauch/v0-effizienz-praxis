import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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
      throw insertError
    }

    if (process.env.RESEND_API_KEY) {
      // Notify super admins
      try {
        const { data: superAdmins } = await supabase
          .from("users")
          .select("email")
          .or("role.eq.super_admin,role.eq.superadmin")

        const adminEmails = superAdmins?.map((a) => a.email).filter(Boolean) as string[]

        if (adminEmails.length > 0) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Effizienz Praxis <noreply@resend.dev>",
            to: adminEmails,
            subject: "Neue Wartelisten-Registrierung",
            html: `
              <h2>Neue Wartelisten-Registrierung</h2>
              <p><strong>E-Mail:</strong> ${email}</p>
              ${name ? `<p><strong>Name:</strong> ${name}</p>` : ""}
              ${practice_name ? `<p><strong>Praxis:</strong> ${practice_name}</p>` : ""}
              ${practice_type ? `<p><strong>Fachbereich:</strong> ${practice_type}</p>` : ""}
              ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ""}
              ${message ? `<p><strong>Nachricht:</strong> ${message}</p>` : ""}
            `,
          })
        }
      } catch (e) {
        console.warn("Admin notification failed:", e)
      }

      // Send confirmation to user
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Effizienz Praxis <noreply@resend.dev>",
          to: email,
          subject: "Bestätigung Ihrer Registrierung",
          html: `
            <h2>Willkommen bei Effizienz Praxis</h2>
            <p>Guten Tag${name ? " " + name : ""},</p>
            <p>vielen Dank für Ihre Registrierung. Wir melden uns bei Ihnen, sobald wir mit dem Early Access starten.</p>
            <p>Viele Grüße<br/>Ihr Effizienz-Praxis-Team</p>
          `,
        })
      } catch (e) {
        console.warn("Confirmation email failed:", e)
      }
    }

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
