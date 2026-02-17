import { createClient, createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-Mail-Adresse erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Find the user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, is_active, created_at")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (userError || !user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true })
    }

    // Only process if user is not already active
    if (user.is_active) {
      return NextResponse.json({ success: true })
    }

    // Rate limit: check if a request was sent in the last 10 minutes
    const { data: recentRequest } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "system_announcement")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .like("metadata->>activation_request_for", user.id)
      .limit(1)
      .maybeSingle()

    if (recentRequest) {
      // Silently succeed (don't reveal rate limiting)
      return NextResponse.json({ success: true })
    }

    // Find super admin users to notify
    const { data: admins } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "super_admin")
      .eq("is_active", true)
      .is("deleted_at", null)

    if (admins && admins.length > 0) {
      // Create in-app notification for admins
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        title: "Neue Aktivierungsanfrage",
        message: `${user.first_name || ""} ${user.last_name || ""} (${user.email}) bittet um Kontoaktivierung.`,
        type: "system_announcement" as const,
        link: "/super-admin/approvals",
        metadata: { activation_request_for: user.id },
        is_read: false,
        created_at: new Date().toISOString(),
      }))

      await supabase.from("notifications").insert(notifications)

      // Send email to first admin
      const adminEmail = admins[0].email
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: "Neue Aktivierungsanfrage - Effizienz Praxis",
          html: `
            <h2>Neue Aktivierungsanfrage</h2>
            <p><strong>${user.first_name || ""} ${user.last_name || ""}</strong> (${user.email}) hat eine Kontoaktivierung angefragt.</p>
            <p>Registriert am: ${new Date(user.created_at).toLocaleDateString("de-DE")}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"}/super-admin/approvals">Zum Genehmigungsbereich</a></p>
          `,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[request-activation] Error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
