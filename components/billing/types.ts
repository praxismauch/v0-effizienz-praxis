export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly?: number | null
  old_price_monthly?: number | null
  old_price_yearly?: number | null
  features: string[]
  max_users: number | null
  max_team_members: number | null
  is_active: boolean
  trial_days?: number
}

export interface PracticeSubscription {
  id: string
  practice_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  practices: { id: string; name: string; email: string }
  subscription_plans: SubscriptionPlan
}

export interface PlanConfigData {
  name: string
  description: string
  priceMonthly: string
  priceYearly?: string
  oldPriceMonthly?: string
  oldPriceYearly?: string
  isActive: boolean
  maxUsers: number | null
  maxTeamMembers: number | null
  features: string[]
  billingInterval?: string
  autoRenew?: boolean
  maxPractices?: number | null
  storageLimit?: number | null
  featureTodos?: boolean
  featureGoals?: boolean
  featureWorkflows?: boolean
  featureTeam?: boolean
  featureReports?: boolean
  featureAi?: boolean
  featureApi?: boolean
  featurePrioritySupport?: boolean
  trialDays?: string | null
  allowDowngrades?: boolean
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    trial: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    past_due: "bg-orange-100 text-orange-800",
    canceled: "bg-gray-100 text-gray-800",
    unpaid: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    trial: "Testversion",
    active: "Aktiv",
    past_due: "Überfällig",
    canceled: "Gekündigt",
    unpaid: "Unbezahlt",
  }
  return labels[status] || status
}

export function planToPlanConfigData(plan: SubscriptionPlan): PlanConfigData {
  return {
    name: plan.name,
    description: plan.description,
    priceMonthly: (plan.price_monthly / 100).toFixed(2),
    priceYearly: plan.price_yearly ? (plan.price_yearly / 100).toFixed(2) : "",
    oldPriceMonthly: plan.old_price_monthly ? (plan.old_price_monthly / 100).toFixed(2) : "",
    oldPriceYearly: plan.old_price_yearly ? (plan.old_price_yearly / 100).toFixed(2) : "",
    isActive: plan.is_active,
    maxUsers: plan.max_users,
    maxTeamMembers: plan.max_team_members,
    features: plan.features,
    trialDays: plan.trial_days?.toString() || "30",
  }
}
