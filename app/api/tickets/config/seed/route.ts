import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * POST /api/tickets/config/seed
 * Resets ticket configuration to default values
 * Super admin only - requires authentication
 */
export async function POST(request: Request) {
  try {

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to verify user permissions" }, { status: 500 })
    }

    const userRole = userData.role?.toLowerCase().replace(/_/g, "") || ""
    const isSuperAdmin = userRole === "superadmin"

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Insufficient permissions. Super admin access required." }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const adminClient = await createAdminClient()

    // Default seed data
    const defaultStatuses = [
      {
        value: "open",
        label_de: "Offen",
        label_en: "Open",
        color_class: "bg-yellow-500",
        icon_name: "AlertCircle",
        sort_order: 1,
      },
      {
        value: "in_progress",
        label_de: "In Bearbeitung",
        label_en: "In Progress",
        color_class: "bg-blue-500",
        icon_name: "PlayCircle",
        sort_order: 2,
      },
      {
        value: "to_test",
        label_de: "Zu testen",
        label_en: "To Test",
        color_class: "bg-purple-500",
        icon_name: "FlaskConical",
        sort_order: 3,
      },
      {
        value: "resolved",
        label_de: "Gelöst",
        label_en: "Resolved",
        color_class: "bg-green-500",
        icon_name: "CheckCircle2",
        sort_order: 4,
      },
      {
        value: "closed",
        label_de: "Geschlossen",
        label_en: "Closed",
        color_class: "bg-gray-500",
        icon_name: "XCircle",
        sort_order: 5,
      },
      {
        value: "wont_fix",
        label_de: "Wird nicht behoben",
        label_en: "Won't Fix",
        color_class: "bg-red-500",
        icon_name: "Ban",
        sort_order: 6,
      },
    ]

    const defaultPriorities = [
      {
        value: "low",
        label_de: "Niedrig",
        label_en: "Low",
        color_class: "bg-gray-500",
        urgency_level: 1,
        escalation_hours: 168,
        sort_order: 1,
      },
      {
        value: "medium",
        label_de: "Mittel",
        label_en: "Medium",
        color_class: "bg-blue-500",
        urgency_level: 2,
        escalation_hours: 72,
        sort_order: 2,
      },
      {
        value: "high",
        label_de: "Hoch",
        label_en: "High",
        color_class: "bg-orange-500",
        urgency_level: 3,
        escalation_hours: 24,
        sort_order: 3,
      },
      {
        value: "urgent",
        label_de: "Dringend",
        label_en: "Urgent",
        color_class: "bg-red-500",
        urgency_level: 4,
        escalation_hours: 4,
        sort_order: 4,
      },
    ]

    const defaultTypes = [
      { value: "bug", label_de: "Bug", label_en: "Bug", icon_name: "Bug", requires_steps: true, sort_order: 1 },
      {
        value: "feature_request",
        label_de: "Feature-Anfrage",
        label_en: "Feature Request",
        icon_name: "Lightbulb",
        requires_steps: false,
        sort_order: 2,
      },
      {
        value: "question",
        label_de: "Frage",
        label_en: "Question",
        icon_name: "HelpCircle",
        requires_steps: false,
        sort_order: 3,
      },
      {
        value: "other",
        label_de: "Sonstiges",
        label_en: "Other",
        icon_name: "MoreHorizontal",
        requires_steps: false,
        sort_order: 4,
      },
    ]

    // Upsert configurations (will update if exists, insert if not)
    const [statusesResult, prioritiesResult, typesResult] = await Promise.all([
      adminClient.from("ticket_statuses").upsert(defaultStatuses, { onConflict: "value" }),
      adminClient.from("ticket_priorities").upsert(defaultPriorities, { onConflict: "value" }),
      adminClient.from("ticket_types").upsert(defaultTypes, { onConflict: "value" }),
    ])

    // Check for errors
    if (statusesResult.error) {
      console.error("[v0] Error seeding statuses:", statusesResult.error)
      return NextResponse.json(
        { error: "Failed to seed statuses", details: statusesResult.error.message },
        { status: 500 },
      )
    }

    if (prioritiesResult.error) {
      console.error("[v0] Error seeding priorities:", prioritiesResult.error)
      return NextResponse.json(
        { error: "Failed to seed priorities", details: prioritiesResult.error.message },
        { status: 500 },
      )
    }

    if (typesResult.error) {
      console.error("[v0] Error seeding types:", typesResult.error)
      return NextResponse.json({ error: "Failed to seed types", details: typesResult.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Ticket configuration seeded successfully",
      seeded: {
        statuses: defaultStatuses.length,
        priorities: defaultPriorities.length,
        types: defaultTypes.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error in tickets config seed POST:", error)
    return NextResponse.json(
      {
        error: "Failed to seed ticket configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
