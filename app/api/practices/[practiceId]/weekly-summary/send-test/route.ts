import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { format, startOfWeek, endOfWeek, subWeeks, addDays, isWithinInterval } from "date-fns"
import { de } from "date-fns/locale"

interface ForecastItem {
  type: "birthday" | "event" | "todo" | "maintenance" | "contract" | "training"
  date: Date
  title: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  icon: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { settings } = await request.json()

    // Get practice info (practices table uses INTEGER id)
    const { data: practice } = await supabase
      .from("practices")
      .select("name, email, logo_url")
      .eq("id", Number.parseInt(practiceId))
      .single()

    // Gather summary data
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    const nextWeekStart = addDays(weekEnd, 1)
    const nextWeekEnd = addDays(nextWeekStart, 6)

    // Get todos count (todos table uses TEXT practice_id)
    const { count: openTodos } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("completed", false)

    const { count: completedTodos } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("completed", true)
      .gte("updated_at", lastWeekStart.toISOString())

    // Get appointments count (calendar_events uses TEXT practice_id)
    const { count: appointmentsCount } = await supabase
      .from("calendar_events")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString())

    // Get team members (team_members uses TEXT practice_id)
    const { count: teamCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("is_active", true)

    // Get documents count (documents uses TEXT practice_id)
    const { count: documentsCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .gte("created_at", lastWeekStart.toISOString())

    const forecastItems: ForecastItem[] = []

    if (settings.include_weekly_forecast) {
      // 1. Get team member birthdays for next week
      const { data: teamMembers } = await supabase
        .from("practice_users")
        .select("users(id, first_name, last_name, date_of_birth)")
        .eq("practice_id", Number.parseInt(practiceId))
        .eq("is_active", true)

      if (teamMembers) {
        const currentYear = new Date().getFullYear()
        teamMembers.forEach((member: any) => {
          if (member.users?.date_of_birth) {
            const birthDate = new Date(member.users.date_of_birth)
            const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())

            // Check if birthday falls in next week
            if (isWithinInterval(birthdayThisYear, { start: nextWeekStart, end: nextWeekEnd })) {
              const age = currentYear - birthDate.getFullYear()
              forecastItems.push({
                type: "birthday",
                date: birthdayThisYear,
                title: `🎂 ${member.users.first_name} ${member.users.last_name}`,
                description: `wird ${age} Jahre alt`,
                icon: "🎂",
              })
            }
          }
        })
      }

      // 2. Get calendar events for next week (calendar_events uses TEXT practice_id)
      const { data: nextWeekEvents } = await supabase
        .from("calendar_events")
        .select("id, title, start_time, event_type, description")
        .eq("practice_id", practiceId)
        .gte("start_time", nextWeekStart.toISOString())
        .lte("start_time", nextWeekEnd.toISOString())
        .order("start_time", { ascending: true })
        .limit(10)

      if (nextWeekEvents) {
        nextWeekEvents.forEach((event: any) => {
          forecastItems.push({
            type: "event",
            date: new Date(event.start_time),
            title: event.title,
            description: event.event_type || "Termin",
            icon: "📅",
          })
        })
      }

      // 3. Get todos due next week (todos uses TEXT practice_id)
      const { data: dueTodos } = await supabase
        .from("todos")
        .select("id, title, due_date, priority, category")
        .eq("practice_id", practiceId)
        .eq("completed", false)
        .gte("due_date", nextWeekStart.toISOString().split("T")[0])
        .lte("due_date", nextWeekEnd.toISOString().split("T")[0])
        .order("due_date", { ascending: true })
        .limit(10)

      if (dueTodos) {
        dueTodos.forEach((todo: any) => {
          forecastItems.push({
            type: "todo",
            date: new Date(todo.due_date),
            title: todo.title,
            description: todo.category || "Aufgabe",
            priority: todo.priority,
            icon: todo.priority === "urgent" || todo.priority === "high" ? "🔴" : "📋",
          })
        })
      }

      // 4. Get device maintenance due next week (devices uses TEXT practice_id)
      const { data: maintenanceDue } = await supabase
        .from("devices")
        .select("id, name, next_maintenance_date, device_type")
        .eq("practice_id", practiceId)
        .gte("next_maintenance_date", nextWeekStart.toISOString().split("T")[0])
        .lte("next_maintenance_date", nextWeekEnd.toISOString().split("T")[0])
        .limit(5)

      if (maintenanceDue) {
        maintenanceDue.forEach((device: any) => {
          forecastItems.push({
            type: "maintenance",
            date: new Date(device.next_maintenance_date),
            title: `Wartung: ${device.name}`,
            description: device.device_type || "Gerät",
            icon: "🔧",
          })
        })
      }

      // 5. Get training/certifications expiring next week (team_member_skills uses TEXT practice_id)
      const { data: expiringCerts } = await supabase
        .from("team_member_skills")
        .select("id, certification_expires_at, skills(name), team_members(users(first_name, last_name))")
        .eq("practice_id", practiceId)
        .gte("certification_expires_at", nextWeekStart.toISOString().split("T")[0])
        .lte("certification_expires_at", nextWeekEnd.toISOString().split("T")[0])
        .limit(5)

      if (expiringCerts) {
        expiringCerts.forEach((cert: any) => {
          if (cert.skills?.name && cert.team_members?.users) {
            forecastItems.push({
              type: "training",
              date: new Date(cert.certification_expires_at),
              title: `Zertifikat läuft ab: ${cert.skills.name}`,
              description: `${cert.team_members.users.first_name} ${cert.team_members.users.last_name}`,
              priority: "high",
              icon: "📜",
            })
          }
        })
      }

      // Sort forecast items by date
      forecastItems.sort((a, b) => a.date.getTime() - b.date.getTime())
    }

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

    const generateForecastHtml = () => {
      if (!settings.include_weekly_forecast || forecastItems.length === 0) return ""

      const nextWeekFormatted = `${format(nextWeekStart, "dd.MM.", { locale: de })} - ${format(nextWeekEnd, "dd.MM.yyyy", { locale: de })}`

      // Group items by date
      const itemsByDate = forecastItems.reduce(
        (acc, item) => {
          const dateKey = format(item.date, "yyyy-MM-dd")
          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(item)
          return acc
        },
        {} as Record<string, ForecastItem[]>,
      )

      let forecastHtml = `
      <div style="margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          🔮 Vorschau nächste Woche
        </h3>
        <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.9;">${nextWeekFormatted}</p>
      `

      // Birthdays section (special highlight)
      const birthdays = forecastItems.filter((i) => i.type === "birthday")
      if (birthdays.length > 0) {
        forecastHtml += `
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">🎉 Geburtstage</h4>
          ${birthdays
            .map(
              (b) => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 12px; opacity: 0.8;">${format(b.date, "EEEE, dd.MM.", { locale: de })}</span>
              <span style="font-weight: 500;">${b.title}</span>
              <span style="font-size: 12px; opacity: 0.8;">${b.description}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        `
      }

      // Other items grouped by type
      const events = forecastItems.filter((i) => i.type === "event")
      const todos = forecastItems.filter((i) => i.type === "todo")
      const maintenance = forecastItems.filter((i) => i.type === "maintenance")
      const training = forecastItems.filter((i) => i.type === "training")

      if (events.length > 0) {
        forecastHtml += `
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">📅 Wichtige Termine (${events.length})</h4>
          ${events
            .slice(0, 5)
            .map(
              (e) => `
            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 11px; opacity: 0.7;">${format(e.date, "EEEE, dd.MM. HH:mm", { locale: de })} Uhr</div>
              <div style="font-weight: 500;">${e.title}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        `
      }

      if (todos.length > 0) {
        forecastHtml += `
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">📋 Fällige Aufgaben (${todos.length})</h4>
          ${todos
            .slice(0, 5)
            .map(
              (t) => `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; opacity: 0.7; min-width: 60px;">${format(t.date, "dd.MM.", { locale: de })}</span>
              <span style="font-weight: 500;">${t.icon} ${t.title}</span>
              ${t.priority === "urgent" || t.priority === "high" ? '<span style="background: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Dringend</span>' : ""}
            </div>
          `,
            )
            .join("")}
        </div>
        `
      }

      if (maintenance.length > 0) {
        forecastHtml += `
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">🔧 Anstehende Wartungen (${maintenance.length})</h4>
          ${maintenance
            .map(
              (m) => `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; opacity: 0.7; min-width: 60px;">${format(m.date, "dd.MM.", { locale: de })}</span>
              <span style="font-weight: 500;">${m.title}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        `
      }

      if (training.length > 0) {
        forecastHtml += `
        <div style="background: rgba(239,68,68,0.2); border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(239,68,68,0.3);">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">⚠️ Ablaufende Zertifikate (${training.length})</h4>
          ${training
            .map(
              (t) => `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; opacity: 0.7; min-width: 60px;">${format(t.date, "dd.MM.", { locale: de })}</span>
              <span style="font-weight: 500;">${t.title}</span>
              <span style="font-size: 11px; opacity: 0.8;">(${t.description})</span>
            </div>
          `,
            )
            .join("")}
        </div>
        `
      }

      // Summary count
      forecastHtml += `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 13px; opacity: 0.9;">
          ${forecastItems.length} wichtige Ereignisse in der kommenden Woche
        </div>
      </div>
      `

      return forecastHtml
    }

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

      ${/* Added forecast section */ ""}
      ${generateForecastHtml()}

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
        forecast_items_count: forecastItems.length,
        forecast_birthdays: forecastItems.filter((i) => i.type === "birthday").length,
        forecast_events: forecastItems.filter((i) => i.type === "event").length,
        forecast_todos: forecastItems.filter((i) => i.type === "todo").length,
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
      forecastItemsCount: forecastItems.length,
    })
  } catch (error: any) {
    console.error("Error sending weekly summary:", error)
    return NextResponse.json({ error: error.message || "Failed to send summary" }, { status: 500 })
  }
}
