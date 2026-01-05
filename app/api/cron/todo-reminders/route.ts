import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured, getEmailConfigStatus } from "@/lib/email/send-email"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const emailStatus = await getEmailConfigStatus()

    if (!(await isEmailConfigured())) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured",
          details: emailStatus,
        },
        { status: 503 },
      )
    }

    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    const today = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)

    const todayStr = today.toISOString().split("T")[0]
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0]

    const { data: todos, error: todosError } = await supabase
      .from("todos")
      .select("*, practices(name)")
      .eq("completed", false)
      .not("assigned_to", "is", null)
      .not("due_date", "is", null)
      .gte("due_date", todayStr)
      .lte("due_date", threeDaysStr)

    if (todosError) {
      console.error("Error fetching todos:", todosError)
      throw todosError
    }

    if (!todos || todos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No todos due in next 3 days",
        count: 0,
      })
    }

    const userIds = [...new Set(todos.map((todo) => todo.assigned_to).filter(Boolean))]

    const { data: users, error: usersError } = await supabase.from("users").select("id, name, email").in("id", userIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      throw usersError
    }

    const userMap = new Map(users?.map((u) => [u.id, u]) || [])

    const todosByUser = new Map<string, typeof todos>()
    for (const todo of todos) {
      if (!todo.assigned_to) continue
      if (!todosByUser.has(todo.assigned_to)) {
        todosByUser.set(todo.assigned_to, [])
      }
      todosByUser.get(todo.assigned_to)!.push(todo)
    }

    const emailResults = []

    for (const [userId, userTodos] of todosByUser.entries()) {
      const user = userMap.get(userId)
      if (!user || !user.email) {
        continue
      }

      const sortedTodos = userTodos.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

      const todosHtml = sortedTodos
        .map((todo) => {
          const dueDate = new Date(todo.due_date!)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const urgencyColor = daysUntilDue === 0 ? "#dc2626" : daysUntilDue === 1 ? "#ea580c" : "#f59e0b"
          const urgencyText =
            daysUntilDue === 0
              ? "Heute fällig"
              : daysUntilDue === 1
                ? "Morgen fällig"
                : `Fällig in ${daysUntilDue} Tagen`

          const priorityBadge =
            todo.priority === "high"
              ? '<span style="background-color: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Hoch</span>'
              : todo.priority === "medium"
                ? '<span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Mittel</span>'
                : '<span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Niedrig</span>'

          return `
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${urgencyColor};">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 16px; color: #111827;">${todo.title}</h3>
                ${priorityBadge}
              </div>
              ${todo.description ? `<p style="margin: 8px 0; color: #6b7280; font-size: 14px;">${todo.description}</p>` : ""}
              <div style="display: flex; gap: 16px; align-items: center; margin-top: 8px;">
                <span style="color: ${urgencyColor}; font-weight: 600; font-size: 14px;">⏰ ${urgencyText}</span>
                <span style="color: #6b7280; font-size: 14px;">📅 ${dueDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </div>
            </div>
          `
        })
        .join("")

      try {
        const emailResult = await sendEmail({
          to: user.email,
          subject: `🔔 Erinnerung: ${sortedTodos.length} ${sortedTodos.length === 1 ? "Aufgabe" : "Aufgaben"} ${sortedTodos.length === 1 ? "ist" : "sind"} bald fällig`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #111827; margin: 0;">Effizienz Praxis</h1>
                <p style="color: #6b7280; margin-top: 8px;">Aufgaben-Erinnerung</p>
              </div>

              <h2 style="color: #111827; margin-bottom: 16px;">Hallo ${user.name || ""},</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                Sie haben <strong>${sortedTodos.length}</strong> ${sortedTodos.length === 1 ? "Aufgabe" : "Aufgaben"}, 
                ${sortedTodos.length === 1 ? "die" : "die"} in den nächsten 3 Tagen ${sortedTodos.length === 1 ? "fällig ist" : "fällig sind"}:
              </p>

              <div style="margin: 24px 0;">
                ${todosHtml}
              </div>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/todos" 
                     style="background-color: #0070f3; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                    Aufgaben anzeigen
                  </a>
                </p>
                <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 16px;">
                  Diese E-Mail wurde automatisch von Effizienz Praxis gesendet.
                </p>
              </div>
            </div>
          `,
        })

        if (!emailResult.success) {
          console.error("Error sending email to", user.email, ":", emailResult.error)
          emailResults.push({
            userId,
            email: user.email,
            success: false,
            error: emailResult.error,
          })
        } else {
          emailResults.push({
            userId,
            email: user.email,
            success: true,
            emailId: emailResult.emailId,
            todoCount: userTodos.length,
          })
        }
      } catch (emailError) {
        console.error("Exception sending email to", user.email, ":", emailError)
        emailResults.push({
          userId,
          email: user.email,
          success: false,
          error: emailError,
        })
      }
    }

    const successCount = emailResults.filter((r) => r.success).length
    const failCount = emailResults.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: "Todo reminders processed",
      stats: {
        todosFound: todos.length,
        usersNotified: todosByUser.size,
        emailsSent: successCount,
        emailsFailed: failCount,
      },
      results: emailResults,
    })
  } catch (error) {
    console.error("Error in todo reminder cron job:", error)
    return NextResponse.json(
      {
        error: "Failed to process todo reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
