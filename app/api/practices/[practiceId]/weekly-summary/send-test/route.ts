import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { de } from "date-fns/locale"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { settings } = await request.json()

    // Get practice info
    const { data: practice } = await supabase
      .from("practices")
      .select("name, email, logo_url")
      .eq("id", Number.parseInt(practiceId))
      .single()

    // Gather summary data
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    // Get todos count
    const { count: openTodos } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", Number.parseInt(practiceId))
      .eq("completed", false)

    const { count: completedTodos } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", Number.parseInt(practiceId))
      .eq("completed", true)
      .gte("updated_at", lastWeekStart.toISOString())

    // Get appointments count
    const { count: appointmentsCount } = await supabase
      .from("calendar_events")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", Number.parseInt(practiceId))
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString())

    // Get team members
    const { count: teamCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", Number.parseInt(practiceId))
      .eq("is_active", true)

    // Get documents count
    const { count: documentsCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", Number.parseInt(practiceId))
      .gte("created_at", lastWeekStart.toISOString())

    // Build recipients list
    const recipients: string[] = []

    if (settings.send_to_admins) {
      const { data: admins } = await supabase
        .from("practice_users")
        .select("users(email)")
        .eq("practice_id", Number.parseInt(practiceId))
        .eq("role", "admin")

      admins?.forEach((a: any) => {
        if (a.users?.email) recipients.push(a.users.email)
      })
    }

    settings.recipients?.forEach((r: any) => {
      if (r.email && !recipients.includes(r.email)) {
        recipients.push(r.email)
      }
    })

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Keine Empfänger konfiguriert" }, { status: 400 })
    }

    // Generate email HTML
    const weekNumber = format(new Date(), "w", { locale: de })
    const monthYear = format(new Date(), "MMMM yyyy", { locale: de })

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wöchentliche Zusammenfassung</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: ${settings.branding_color || "#3b82f6"}; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      ${settings.include_logo && practice?.logo_url ? `<img src="${practice.logo_url}" alt="${practice?.name}" style="height: 48px; margin-bottom: 16px;">` : ""}
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Wöchentliche Zusammenfassung</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Kalenderwoche ${weekNumber} - ${monthYear}</p>
    </div>
    
    <!-- Content -->
    <div style="background-color: white; padding: 32px; border-radius: 0 0 12px 12px;">
      ${settings.custom_intro ? `<p style="color: #71717a; margin-bottom: 24px;">${settings.custom_intro}</p>` : ""}
      
      <!-- Quick Stats -->
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        <div style="flex: 1; text-align: center; padding: 20px; background-color: #f4f4f5; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: #3b82f6;">${completedTodos || 0}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Aufgaben erledigt</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 20px; background-color: #f4f4f5; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: #22c55e;">${appointmentsCount || 0}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Termine diese Woche</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 20px; background-color: #f4f4f5; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">${openTodos || 0}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Offene Aufgaben</div>
        </div>
      </div>

      ${
        settings.include_todos
          ? `
      <!-- Todos Section -->
      <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          📋 Aufgaben-Übersicht
        </h3>
        <p style="color: #71717a; margin: 0; font-size: 14px;">
          ${openTodos || 0} offene Aufgaben • ${completedTodos || 0} diese Woche erledigt
        </p>
      </div>
      `
          : ""
      }

      ${
        settings.include_appointments
          ? `
      <!-- Appointments Section -->
      <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">
          📅 Termine
        </h3>
        <p style="color: #71717a; margin: 0; font-size: 14px;">
          ${appointmentsCount || 0} Termine in dieser Woche geplant
        </p>
      </div>
      `
          : ""
      }

      ${
        settings.include_team_updates
          ? `
      <!-- Team Section -->
      <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">
          👥 Team
        </h3>
        <p style="color: #71717a; margin: 0; font-size: 14px;">
          ${teamCount || 0} aktive Teammitglieder
        </p>
      </div>
      `
          : ""
      }

      ${
        settings.include_documents
          ? `
      <!-- Documents Section -->
      <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">
          📄 Dokumente
        </h3>
        <p style="color: #71717a; margin: 0; font-size: 14px;">
          ${documentsCount || 0} neue Dokumente diese Woche
        </p>
      </div>
      `
          : ""
      }

      ${
        settings.include_ai_insights
          ? `
      <!-- AI Insights -->
      <div style="margin-bottom: 24px; padding: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1d4ed8;">
          ✨ KI-Empfehlung
        </h3>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          Basierend auf der Analyse Ihrer Praxisdaten: Konzentrieren Sie sich diese Woche auf die ${openTodos || 0} offenen Aufgaben, um Ihre Produktivität zu steigern.
        </p>
      </div>
      `
          : ""
      }

      ${
        settings.custom_footer
          ? `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
        <p style="color: #71717a; font-size: 14px; margin: 0;">${settings.custom_footer}</p>
      </div>
      `
          : ""
      }

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
          Diese E-Mail wurde automatisch von Effizienz Praxis generiert.
        </p>
        <p style="color: #a1a1aa; font-size: 12px; margin: 8px 0 0 0;">
          ${practice?.name || "Ihre Praxis"} • ${format(new Date(), "dd.MM.yyyy", { locale: de })}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Send email to all recipients
    const emailPromises = recipients.map((email) =>
      sendEmail({
        to: email,
        subject: `Wöchentliche Praxis-Zusammenfassung - KW ${weekNumber}`,
        html: emailHtml,
      }),
    )

    const results = await Promise.allSettled(emailPromises)
    const successCount = results.filter((r) => r.status === "fulfilled").length
    const failedCount = results.filter((r) => r.status === "rejected").length

    // Log to history
    await supabase.from("weekly_summary_history").insert({
      practice_id: Number.parseInt(practiceId),
      recipients_count: successCount,
      recipients: recipients,
      status: failedCount === 0 ? "sent" : failedCount === recipients.length ? "failed" : "partial",
      todos_count: (openTodos || 0) + (completedTodos || 0),
      appointments_count: appointmentsCount || 0,
      open_tasks: openTodos || 0,
      completed_tasks: completedTodos || 0,
      summary_data: {
        team_count: teamCount,
        documents_count: documentsCount,
      },
    })

    // Update settings with last sent info
    await supabase
      .from("weekly_summary_settings")
      .update({
        last_sent_at: new Date().toISOString(),
        last_sent_status: failedCount === 0 ? "sent" : "partial",
        send_count: (settings.send_count || 0) + 1,
      })
      .eq("practice_id", Number.parseInt(practiceId))

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      recipients: recipients.length,
    })
  } catch (error: any) {
    console.error("Error sending weekly summary:", error)
    return NextResponse.json({ error: error.message || "Failed to send summary" }, { status: 500 })
  }
}
