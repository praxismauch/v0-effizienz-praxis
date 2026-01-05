import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch subscription for practice
    const { data: subscription, error: subscriptionError } = await supabase
      .from("practice_subscriptions")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subscriptionError)
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
    }

    // If no subscription exists, return a default trial period (30 days from practice creation)
    if (!subscription) {
      const { data: practice } = await supabase.from("practices").select("created_at").eq("id", practiceId).single()

      if (practice) {
        const createdAt = new Date(practice.created_at)
        const trialEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

        return NextResponse.json({
          subscription: {
            status: "trialing",
            trial_end: trialEnd.toISOString(),
            plan_id: null,
          },
        })
      }
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error in subscription route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
