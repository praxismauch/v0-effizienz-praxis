import { createClient, createAdminClient } from "@/lib/supabase/server"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedOnly = searchParams.get("published") !== "false"

    // Use admin client for full listing (bypasses RLS), fallback to regular client
    const supabase = hasSupabaseAdminConfig() ? await createAdminClient() : await createClient()

    let query = supabase
      .from("changelogs")
      .select("*")
      .is("deleted_at", null)
      .order("release_date", { ascending: false })

    if (publishedOnly) {
      query = query.eq("is_published", true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching changelogs:", error)
    return NextResponse.json({ error: "Failed to fetch changelogs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { version, title, description, changes, change_type, is_published } = body

    // Use admin client for insert to bypass RLS
    const adminClient = hasSupabaseAdminConfig() ? await createAdminClient() : supabase

    const { data, error } = await adminClient
      .from("changelogs")
      .insert({
        version,
        title,
        description,
        changes: changes || [],
        change_type: change_type || "minor",
        is_published: is_published || false,
        release_date: new Date().toISOString().split("T")[0],
        published_at: is_published ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating changelog:", error)
    return NextResponse.json({ error: "Failed to create changelog" }, { status: 500 })
  }
}
