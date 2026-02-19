import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function isRateLimitError(e: unknown): boolean {
  if (!e) return false
  const message = e instanceof Error ? e.message : String(e)
  return (
    e instanceof SyntaxError ||
    message.includes("Too Many") ||
    message.includes("Unexpected token") ||
    message.includes("is not valid JSON")
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID", placeId: null }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      console.warn("[v0] Google reviews config: Failed to create client")
      return NextResponse.json({ placeId: null })
    }

    try {
      const { data, error } = await supabase.from("practices").select("settings").eq("id", practiceId).maybeSingle()

      if (error) {
        console.warn("[v0] Google reviews config GET error:", error.message)
        return NextResponse.json({ placeId: null })
      }

      if (!data) {
        // Practice not found or no settings — return placeId: null (not an error for the widget)
        return NextResponse.json({ placeId: null })
      }

      const placeId = data?.settings?.googlePlaceId || null
      return NextResponse.json({ placeId })
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Google reviews config: Rate limited")
        return NextResponse.json({ placeId: null })
      }
      throw queryError
    }
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Google reviews config: Rate limited (outer)")
      return NextResponse.json({ placeId: null })
    }
    console.error("Error fetching Google Reviews configuration:", error)
    return NextResponse.json({ placeId: null })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { placeId } = await request.json()

    const { data: currentData } = await supabase.from("practices").select("settings").eq("id", practiceId).single()

    const updatedSettings = {
      ...(currentData?.settings || {}),
      googlePlaceId: placeId,
    }

    const { error } = await supabase.from("practices").update({ settings: updatedSettings }).eq("id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true, placeId })
  } catch (error: any) {
    if (error?.message?.includes("Too Many") || error?.message?.includes("Unexpected token")) {
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }
    console.error("Error saving Google Reviews configuration:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
