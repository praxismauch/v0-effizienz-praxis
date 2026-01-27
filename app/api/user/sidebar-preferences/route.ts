import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { practice_id, sidebar_collapsed, expanded_groups, expanded_items } = body

    const adminClient = await createAdminClient()

    const dataToUpsert: Record<string, any> = {
      user_id: user.id,
      practice_id: practice_id || "default",
      updated_at: new Date().toISOString(),
    }

    if (sidebar_collapsed !== undefined) {
      dataToUpsert.sidebar_collapsed = sidebar_collapsed
    }
    if (expanded_groups !== undefined) {
      dataToUpsert.expanded_groups = expanded_groups
    }
    if (expanded_items !== undefined) {
      dataToUpsert.expanded_items = expanded_items
    }

    const { error } = await adminClient.from("user_sidebar_preferences").upsert(dataToUpsert, {
      onConflict: "user_id,practice_id",
    })

    if (error) {
      console.error("Error saving sidebar preferences:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in sidebar preferences API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 }
    )
  }
}
