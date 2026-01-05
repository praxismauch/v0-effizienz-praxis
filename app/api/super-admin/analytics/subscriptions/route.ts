import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Get all subscriptions with plan details
    const { data: subscriptions, error } = await supabase.from("practice_subscriptions").select(`
        *,
        plan:subscription_plans(name, price_monthly, price_yearly)
      `)

    if (error) throw error

    // Calculate metrics
    const activeSubscriptions = subscriptions.filter((s: any) => s.status === "active").length

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions
      .filter((s: any) => s.status === "active")
      .reduce((sum: number, s: any) => {
        const monthlyPrice = s.plan?.price_monthly || 0
        return sum + monthlyPrice
      }, 0)

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeSubscriptions > 0 ? mrr / activeSubscriptions : 0

    // Group by status
    const byStatus = subscriptions.reduce((acc: any, curr: any) => {
      const status = curr.status || "unknown"
      if (!acc[status]) {
        acc[status] = { name: status, count: 0 }
      }
      acc[status].count++
      return acc
    }, {})

    // Group by plan
    const byPlan = subscriptions.reduce((acc: any, curr: any) => {
      const planName = curr.plan?.name || "Unknown"
      if (!acc[planName]) {
        acc[planName] = { plan_name: planName, count: 0 }
      }
      acc[planName].count++
      return acc
    }, {})

    // Calculate churn rate (canceled vs total)
    const canceledCount = subscriptions.filter((s: any) => s.status === "canceled").length
    const totalCount = subscriptions.length
    const churnRate = totalCount > 0 ? ((canceledCount / totalCount) * 100).toFixed(2) : 0

    const { data: completedSubs } = await supabase
      .from("practice_subscriptions")
      .select("created_at, canceled_at")
      .not("canceled_at", "is", null)

    let avgSubscriptionMonths = 12 // Default fallback
    if (completedSubs && completedSubs.length > 0) {
      const totalMonths = completedSubs.reduce((sum, sub) => {
        const start = new Date(sub.created_at)
        const end = new Date(sub.canceled_at)
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
        return sum + months
      }, 0)
      avgSubscriptionMonths = Math.round(totalMonths / completedSubs.length)
    }

    const ltv = Math.round((arpu / 100) * avgSubscriptionMonths)

    return NextResponse.json({
      activeSubscriptions,
      mrr,
      arr,
      arpu,
      churnRate: Number.parseFloat(churnRate),
      ltv,
      byStatus: Object.values(byStatus),
      byPlan: Object.values(byPlan),
    })
  } catch (error) {
    console.error("[v0] Error fetching subscription stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
