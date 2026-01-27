import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    // Get kudos with user info
    const { data: kudos, error } = await supabase
      .from("kudos")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    // Get user names for kudos
    const userIds = new Set<string>()
    kudos?.forEach((k) => {
      if (k.from_user_id) userIds.add(k.from_user_id)
      if (k.to_user_id) userIds.add(k.to_user_id)
    })

    const { data: users } = await supabase.from("users").select("id, name, avatar").in("id", Array.from(userIds))

    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id, first_name, last_name, avatar")
      .eq("practice_id", practiceId)

    const userMap = new Map()
    users?.forEach((u) => userMap.set(u.id, u))
    teamMembers?.forEach((tm) => userMap.set(tm.id, tm))

    // Enrich kudos with user info
    const enrichedKudos = kudos?.map((k) => {
      const fromUser = userMap.get(k.from_user_id)
      const toUser = userMap.get(k.to_user_id) || userMap.get(k.to_team_member_id)
      return {
        ...k,
        from_user_name: fromUser?.name,
        from_user_avatar: fromUser?.avatar,
        to_user_name: toUser?.name,
        to_user_avatar: toUser?.avatar,
      }
    })

    return NextResponse.json({ kudos: enrichedKudos || [] })
  } catch (error) {
    console.error("Error fetching kudos:", error)
    return NextResponse.json({ kudos: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()
  const body = await request.json()

  try {
    const { data, error } = await supabase
      .from("kudos")
      .insert({
        practice_id: practiceId,
        from_user_id: body.from_user_id,
        to_user_id: body.to_user_id,
        to_team_member_id: body.to_team_member_id || body.to_user_id,
        category: body.category,
        message: body.message,
        is_public: body.is_public !== false,
        is_anonymous: body.is_anonymous || false,
        reactions: {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ kudos: data })
  } catch (error) {
    console.error("Error creating kudos:", error)
    return NextResponse.json({ error: "Failed to create kudos" }, { status: 500 })
  }
}
