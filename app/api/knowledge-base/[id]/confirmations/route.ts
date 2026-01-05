import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Fetch all confirmations for an article
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const articleId = params.id

    // Fetch confirmations with user details
    const { data: confirmations, error } = await supabase
      .from("knowledge_confirmations")
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("knowledge_article_id", articleId)
      .is("deleted_at", null)
      .order("confirmed_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching confirmations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedConfirmations =
      confirmations?.map((c: any) => ({
        user_id: c.user_id,
        user_name: `${c.users?.first_name || ""} ${c.users?.last_name || ""}`.trim() || c.users?.email || "Unbekannt",
        confirmed_at: c.confirmed_at,
      })) || []

    return NextResponse.json({ confirmations: formattedConfirmations })
  } catch (error) {
    console.error("[v0] Error in confirmations GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Confirm reading an article
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const articleId = params.id
    const body = await request.json()
    const { practice_id } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert or update confirmation
    const { data, error } = await supabase
      .from("knowledge_confirmations")
      .upsert(
        {
          knowledge_article_id: articleId,
          user_id: user.id,
          practice_id,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "knowledge_article_id,user_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating confirmation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ confirmation: data })
  } catch (error) {
    console.error("[v0] Error in confirmations POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
