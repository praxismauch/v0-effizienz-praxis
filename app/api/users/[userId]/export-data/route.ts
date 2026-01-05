import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Fetch user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch related data
    const { data: todosData } = await supabase.from("todos").select("*").eq("user_id", userId)

    const { data: preferencesData } = await supabase.from("user_preferences").select("*").eq("user_id", userId)

    const { data: kvAbrechnungData } = await supabase
      .from("kv_abrechnung")
      .select("*")
      .eq("practice_id", userData.practice_id)

    // Fetch additional user-related data for comprehensive export
    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100)

    // Compile all data
    const exportData = {
      export_date: new Date().toISOString(),
      export_format_version: "1.0",
      user_info: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        phone: userData.phone,
        specialization: userData.specialization,
        preferred_language: userData.preferred_language,
        avatar: userData.avatar,
        is_active: userData.is_active,
      },
      preferences: preferencesData || [],
      todos: (todosData || []).map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
      })),
      notifications: (notificationsData || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
      })),
      messages_summary: {
        total_count: messagesData?.length || 0,
        sent: messagesData?.filter((m) => m.sender_id === userId).length || 0,
        received: messagesData?.filter((m) => m.recipient_id === userId).length || 0,
      },
      kv_abrechnung: kvAbrechnungData || [],
      gdpr_notice: {
        de: "Diese Datei enthält alle Ihre bei uns gespeicherten personenbezogenen Daten gemäß Art. 15 DSGVO (Recht auf Auskunft).",
        en: "This file contains all your personal data stored with us in accordance with Art. 15 GDPR (Right of Access).",
      },
    }

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="meine-daten-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting user data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
