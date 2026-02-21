import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check for v0 preview indicators
    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    const isV0Preview = hasSupabaseConfig && !user

    if (!user && !isV0Preview) {
      return NextResponse.json(
        {
          tickets: [],
          count: 0,
          error: "Not authenticated",
          message: "User must be logged in to view tickets",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const priority = searchParams.get("priority")
    const practiceId = searchParams.get("practiceId")

    let isSuperAdmin = false
    let queryClient = supabase

    if (user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user role:", userError)
      }

      const userRole = userData?.role?.toLowerCase().replace(/_/g, "") || "admin"
      isSuperAdmin = userRole === "superadmin"

      if (isSuperAdmin) {
        queryClient = await createAdminClient()
      }
    } else if (isV0Preview) {
      queryClient = await createAdminClient()
      isSuperAdmin = true
    }

    let query = queryClient.from("tickets").select("*").order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    if (type && type !== "all") {
      query = query.eq("type", type)
    }
    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }
    if (practiceId && !isSuperAdmin) {
      query = query.eq("practice_id", practiceId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching tickets:", error)
      return NextResponse.json({ tickets: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      tickets: data || [],
      count: data?.length || 0,
      filters: { status, type, priority, practiceId },
      isSuperAdmin,
    })
  } catch (error) {
    console.error("Error in tickets GET:", error)
    return NextResponse.json(
      {
        tickets: [],
        error: "Failed to fetch tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()

    if (!body.user_email && !body.user_name) {
      console.error("Missing user information in request body")
      return NextResponse.json({ error: "User information required" }, { status: 400 })
    }

    const ticketData = {
      title: body.title,
      description: body.description || "",
      type: body.type || "bug",
      priority: body.priority || "medium",
      status: "open",
      practice_id: body.practice_id || null,
      user_id: body.user_id || null,
      user_email: body.user_email,
      user_name: body.user_name,
      category: body.category || null,
      screenshot_urls: body.screenshot_urls || [],
      attachments: body.attachments || [],
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("tickets").insert([ticketData]).select().single()

    if (error) {
      console.error("Supabase error creating ticket:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    // Send email notification to super admins (non-blocking)
    notifySuperAdmins(supabase, data).catch((err) =>
      console.error("Failed to send ticket notification email:", err)
    )

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("Exception in tickets POST:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// ── Super Admin Email Notification ──────────────────────────────────
async function notifySuperAdmins(supabase: any, ticket: any) {
  const { data: superAdmins, error } = await supabase
    .from("users")
    .select("email")
    .eq("role", "superadmin")
    .eq("is_active", true)
    .not("email", "is", null)

  if (error || !superAdmins || superAdmins.length === 0) return

  const adminEmails = superAdmins.map((a: any) => a.email).filter(Boolean) as string[]
  if (adminEmails.length === 0) return

  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  })
  const formattedDate = dateFormatter.format(new Date(ticket.created_at))

  const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "#dc2626", text: "#ffffff", label: "Kritisch" },
    high: { bg: "#ea580c", text: "#ffffff", label: "Hoch" },
    medium: { bg: "#f59e0b", text: "#1a1a1a", label: "Mittel" },
    low: { bg: "#22c55e", text: "#ffffff", label: "Niedrig" },
  }

  const typeLabels: Record<string, string> = {
    bug: "Bug",
    feature: "Feature-Wunsch",
    improvement: "Verbesserung",
    question: "Frage",
    task: "Aufgabe",
    other: "Sonstiges",
  }

  const p = priorityColors[ticket.priority] || priorityColors.medium
  const typeLabel = typeLabels[ticket.type] || ticket.type || "Unbekannt"

  const screenshotHtml =
    ticket.screenshot_urls && ticket.screenshot_urls.length > 0
      ? `
        <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
          <h2 style="margin: 0 0 12px 0; font-size: 15px; color: #6b7280;">Screenshots (${ticket.screenshot_urls.length})</h2>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${ticket.screenshot_urls
              .map(
                (url: string) =>
                  `<a href="${url}" target="_blank" style="display:inline-block;"><img src="${url}" alt="Screenshot" style="height:80px;width:80px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" /></a>`
              )
              .join("")}
          </div>
        </div>`
      : ""

  const row = (label: string, value: string | null | undefined) =>
    value
      ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;word-break:break-all;">${value}</td></tr>`
      : ""

  await sendEmail({
    to: adminEmails,
    subject: `Neues Ticket: ${ticket.title} [${p.label}]`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 680px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          
          <div style="background: ${p.bg}; color: ${p.text}; padding: 24px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Neues Ticket erstellt</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">${formattedDate}</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
            
            <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px;">${ticket.title}</h2>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="display: inline-block; background: ${p.bg}; color: ${p.text}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${p.label}</span>
                <span style="display: inline-block; background: #f3f4f6; color: #374151; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${typeLabel}</span>
                ${ticket.category ? `<span style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${ticket.category}</span>` : ""}
              </div>
            </div>
            
            ${ticket.description ? `
            <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Beschreibung</h3>
              <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #374151;">${ticket.description}</p>
            </div>` : ""}

            ${screenshotHtml}

            <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Details</h3>
              <table style="width:100%; border-collapse:collapse; font-size:13px;">
                ${row("Ticket-ID", ticket.id)}
                ${row("Erstellt von", ticket.user_name)}
                ${row("E-Mail", ticket.user_email)}
                ${row("Praxis-ID", ticket.practice_id)}
                ${row("Status", "Offen")}
              </table>
            </div>

            <div style="text-align: center; padding: 20px 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://effizienz-praxis.de"}/super-admin/tickets" 
                 style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Ticket im Admin-Bereich anzeigen
              </a>
            </div>

            <div style="text-align: center; padding: 12px 30px 20px; border-top: 1px solid #f0f0f0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Automatisch generiert von Effizienz-Praxis</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
