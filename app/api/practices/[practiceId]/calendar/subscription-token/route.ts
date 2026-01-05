import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex")

    const supabase = await createAdminClient()

    const { data: practice, error } = await supabase
      .from("practices")
      .select("settings")
      .eq("id", practiceId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching practice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!practice) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    const currentSettings = practice.settings || {}
    const updatedSettings = {
      ...currentSettings,
      calendar_subscription_token: token,
      calendar_subscription_created_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("practices")
      .update({ settings: updatedSettings })
      .eq("id", practiceId)

    if (updateError) {
      console.error("Error updating practice settings:", updateError)
      return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error generating subscription token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
