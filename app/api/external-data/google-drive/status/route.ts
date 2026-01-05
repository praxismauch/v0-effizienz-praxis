import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Missing practiceId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("google_drive_credentials")
      .select("id, created_at")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Failed to check status:", error)
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: !!data,
      connectedAt: data?.created_at,
    })
  } catch (error) {
    console.error("[v0] Google Drive status error:", error)
    return NextResponse.json({ connected: false })
  }
}
