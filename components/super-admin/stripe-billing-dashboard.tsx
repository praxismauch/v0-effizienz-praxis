"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-currency"
import { formatDateDE } from "@/lib/utils"
import {
  CreditCard,
  TrendingUp,
  Users,
  Euro,
  Tag,
  Receipt,
  ArrowUpRight,
  Plus,
  Search,
  Download,
  RefreshCw,
  Settings,
  Building2,
  Copy,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Activity,
  FileText,
  Send,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

// Types
interface BillingStats {
  mrr: number
  arr: number
  totalCustomers: number
  activeSubscriptions: number
  trialSubscriptions: number
  canceledSubscriptions: number
  newSubscriptionsThisMonth: number
  churnRate: number
  averageRevenuePerUser: number
  lifetimeValue: number
  totalRevenue: number
  totalRefunds: number
  couponDiscounts: number
  customDiscounts: number
  growthRate: number
}

interface Coupon {
  id: string
  stripe_coupon_id?: string
  name: string
  code: string
  percent_off?: number
  amount_off?: number
  currency: string
  duration: string
  duration_in_months?: number
  max_redemptions?: number
  times_redeemed: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  applies_to_plans?: string[]
  min_amount?: number
  first_purchase_only: boolean
  created_at: string
}

interface CustomPricing {
  id: string
  practice_id: number
  practice_name?: string
  custom_price_monthly?: number
  custom_price_yearly?: number
  discount_percent?: number
  discount_reason?: string
  valid_from: string
  valid_until?: string
  is_active: boolean
  approved_by?: string
  notes?: string
  created_at: string
}

interface Payment {
  id: string
  practice_id: number
  practice_name?: string
  stripe_payment_intent_id?: string
  stripe_invoice_id?: string
  amount: number
  currency: string
  status: string
  payment_method_type?: string
  description?: string
  invoice_pdf_url?: string
  receipt_url?: string
  failure_reason?: string
  refunded_amount: number
  paid_at?: string
  created_at: string
}

interface Subscription {
  id: string
  practice_id: number
  practice_name?: string
  practice_email?: string
  stripe_subscription_id?: string
  status: string
  plan_name?: string
  price_monthly?: number
  current_period_start?: string
  current_period_end?: string
  trial_end?: string
  cancel_at_period_end: boolean
  created_at: string
}

interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
  churn: number
}

export function StripeBillingDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [customPricing, setCustomPricing] = useState<CustomPricing[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [showCouponDialog, setShowCouponDialog] = useState(false)
  const [showCustomPricingDialog, setShowCustomPricingDialog] = useState(false)
  const [showPaymentDetailDialog, setShowPaymentDetailDialog] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<CustomPricing | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Coupon form state
  const [couponForm, setCouponForm] = useState({
    name: "",
    code: "",
    discountType: "percent" as "percent" | "amount",
    percentOff: "",
    amountOff: "",
    duration: "once" as "once" | "repeating" | "forever",
    durationMonths: "",
    maxRedemptions: "",
    validUntil: "",
    minAmount: "",
    firstPurchaseOnly: false,
    isActive: true,
  })

  // Custom pricing form state
  const [pricingForm, setPricingForm] = useState({
    practiceId: "",
    customPriceMonthly: "",
    customPriceYearly: "",
    discountPercent: "",
    discountReason: "",
    validUntil: "",
    notes: "",
    isActive: true,
  })

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading Zahlungsverwaltung data...")

      // Load coupons
      const couponsRes = await fetch("/api/super-admin/stripe/coupons")
      if (couponsRes.ok) {
        const data = await couponsRes.json()
        console.log("[v0] Loaded coupons:", data.coupons?.length || 0)
        setCoupons(data.coupons || [])
      }

      // Load custom pricing
      const pricingRes = await fetch("/api/super-admin/stripe/custom-pricing")
      if (pricingRes.ok) {
        const data = await pricingRes.json()
        console.log("[v0] Loaded custom pricing:", data.pricing?.length || 0)
        setCustomPricing(data.pricing || [])
      }

      // Load payments
      const paymentsRes = await fetch("/api/super-admin/stripe/payments")
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        console.log("[v0] Loaded payments:", data.payments?.length || 0)
        setPayments(data.payments || [])
      }

      // Load subscriptions
      const subsRes = await fetch("/api/super-admin/stripe/subscriptions")
      if (subsRes.ok) {
        const data = await subsRes.json()
        console.log("[v0] Loaded subscriptions:", data.subscriptions?.length || 0)
        setSubscriptions(data.subscriptions || [])
      }

      // Load stats
      const statsRes = await fetch("/api/super-admin/stripe/stats")
      if (statsRes.ok) {
        const data = await statsRes.json()
        console.log("[v0] Loaded stats:", data.stats)
        setStats(data.stats)
        setRevenueData(data.revenueData || [])
      }
    } catch (error) {
      console.error("[v0] Error loading billing data:", error)
      toast({
        title: "Fehler beim Laden",
        description: "Zahlungsdaten konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Create coupon
  const handleCreateCoupon = async () => {
    try {
      const res = await fetch("/api/super-admin/stripe/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: couponForm.name,
          code: couponForm.code.toUpperCase(),
          percentOff: couponForm.discountType === "percent" ? Number.parseFloat(couponForm.percentOff) : undefined,
          amountOff: couponForm.discountType === "amount" ? Number.parseInt(couponForm.amountOff) * 100 : undefined,
          duration: couponForm.duration,
          durationMonths: couponForm.duration === "repeating" ? Number.parseInt(couponForm.durationMonths) : undefined,
          maxRedemptions: couponForm.maxRedemptions ? Number.parseInt(couponForm.maxRedemptions) : undefined,
          validUntil: couponForm.validUntil || undefined,
          minAmount: couponForm.minAmount ? Number.parseInt(couponForm.minAmount) * 100 : undefined,
          firstPurchaseOnly: couponForm.firstPurchaseOnly,
          isActive: couponForm.isActive,
        }),
      })

      if (res.ok) {
        toast({ title: "Coupon erstellt", description: `Code: ${couponForm.code.toUpperCase()}` })
        setShowCouponDialog(false)
        resetCouponForm()
        await loadData() // Refetch all data after creation
      } else {
        const error = await res.json()
        toast({ title: "Fehler", description: error.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Coupon konnte nicht erstellt werden", variant: "destructive" })
    }
  }

  // Create custom pricing
  const handleCreateCustomPricing = async () => {
    try {
      const res = await fetch("/api/super-admin/stripe/custom-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: Number.parseInt(pricingForm.practiceId),
          customPriceMonthly: pricingForm.customPriceMonthly
            ? Number.parseInt(pricingForm.customPriceMonthly) * 100
            : undefined,
          customPriceYearly: pricingForm.customPriceYearly
            ? Number.parseInt(pricingForm.customPriceYearly) * 100
            : undefined,
          discountPercent: pricingForm.discountPercent ? Number.parseFloat(pricingForm.discountPercent) : undefined,
          discountReason: pricingForm.discountReason,
          validUntil: pricingForm.validUntil || undefined,
          notes: pricingForm.notes,
          isActive: pricingForm.isActive,
        }),
      })

      if (res.ok) {
        toast({ title: "Sonderpreis erstellt", description: "Die individuelle Preisgestaltung wurde gespeichert" })
        setShowCustomPricingDialog(false)
        resetPricingForm()
        await loadData() // Refetch all data after creation
      } else {
        const error = await res.json()
        toast({ title: "Fehler", description: error.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Sonderpreis konnte nicht erstellt werden", variant: "destructive" })
    }
  }

  // Sync with Stripe
  const handleSyncStripe = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/stripe/sync", { method: "POST" })
      if (res.ok) {
        toast({ title: "Stripe synchronisiert", description: "Alle Daten wurden aktualisiert" })
        await loadData() // Refetch all data after sync
      } else {
        toast({ title: "Fehler", description: "Synchronisation fehlgeschlagen", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Stripe-Synchronisation fehlgeschlagen", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Delete coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie diesen Coupon löschen möchten?")) return

    try {
      const res = await fetch(`/api/super-admin/stripe/coupons/${couponId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Coupon gelöscht" })
        await loadData() // Refetch all data after deletion
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Coupon konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  // Copy coupon code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Code kopiert", description: code })
  }

  // Reset forms
  const resetCouponForm = () => {
    setCouponForm({
      name: "",
      code: "",
      discountType: "percent",
      percentOff: "",
      amountOff: "",
      duration: "once",
      durationMonths: "",
      maxRedemptions: "",
      validUntil: "",
      minAmount: "",
      firstPurchaseOnly: false,
      isActive: true,
    })
  }

  const resetPricingForm = () => {
    setPricingForm({
      practiceId: "",
      customPriceMonthly: "",
      customPriceYearly: "",
      discountPercent: "",
      discountReason: "",
      validUntil: "",
      notes: "",
      isActive: true,
    })
  }

  // Filter data
  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.practice_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.practice_email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredPayments = payments.filter(
    (p) =>
      p.practice_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stripe_payment_intent_id?.includes(searchQuery),
  )

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Aktiv" },
      trialing: { variant: "secondary", label: "Testphase" },
      canceled: { variant: "destructive", label: "Gekündigt" },
      past_due: { variant: "destructive", label: "Überfällig" },
      unpaid: { variant: "destructive", label: "Unbezahlt" },
      incomplete: { variant: "outline", label: "Unvollständig" },
      succeeded: { variant: "default", label: "Erfolgreich" },
      pending: { variant: "secondary", label: "Ausstehend" },
      failed: { variant: "destructive", label: "Fehlgeschlagen" },
      refunded: { variant: "outline", label: "Erstattet" },
    }
    const config = variants[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Lade Zahlungsdaten...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Stripe Zahlungsverwaltung</h2>
            <p className="text-muted-foreground">
              Vollständige Übersicht über Abonnements, Zahlungen, Coupons und individuelle Preise
            </p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Neu laden
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Keine Zahlungsdaten verfügbar</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Synchronisieren Sie Stripe oder fügen Sie manuell Daten hinzu
                </p>
              </div>
              <Button onClick={handleSyncStripe}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Mit Stripe synchronisieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stripe Zahlungsverwaltung</h2>
          <p className="text-muted-foreground">
            Vollständige Übersicht über Abonnements, Zahlungen, Coupons und individuelle Preise
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncStripe} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Mit Stripe synchronisieren
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monatlicher Umsatz (MRR)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />+{stats?.growthRate || 0}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Abonnements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-blue-600">+{stats?.newSubscriptionsThisMonth || 0} neu</span>
              <span className="mx-1">·</span>
              <span className="text-amber-600">{stats?.trialSubscriptions || 0} in Testphase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Umsatz/Kunde</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.averageRevenuePerUser || 0)}</div>
            <div className="text-xs text-muted-foreground">LTV: {formatCurrency(stats?.lifetimeValue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abwanderungsrate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.churnRate || 0}%</div>
            <div className="text-xs text-muted-foreground">
              {stats?.canceledSubscriptions || 0} Kündigungen diesen Monat
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discount Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" />
              Coupon-Rabatte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-700">-{formatCurrency(stats?.couponDiscounts || 0)}</div>
            <p className="text-xs text-amber-600">{coupons.filter((c) => c.is_active).length} aktive Coupons</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              Individuelle Rabatte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700">-{formatCurrency(stats?.customDiscounts || 0)}</div>
            <p className="text-xs text-purple-600">
              {customPricing.filter((p) => p.is_active).length} Sonderpreise aktiv
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-600" />
              Netto-Umsatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">
              {formatCurrency((stats?.totalRevenue || 0) - (stats?.totalRefunds || 0))}
            </div>
            <p className="text-xs text-green-600">Nach Rabatten & Erstattungen</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="custom-pricing" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sonderpreise
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Zahlungen
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Umsatzentwicklung (letzte 6 Monate)</CardTitle>
                <CardDescription>Monatlicher Umsatz, Abonnements und Kündigungen</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Umsatz (€)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="subscriptions"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorSubscriptions)"
                        name="Abonnements"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center space-y-2">
                      <BarChart3 className="h-12 w-12 mx-auto" />
                      <p>Keine Umsatzdaten verfügbar</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Abonnement-Verteilung</CardTitle>
                <CardDescription>Nach Status aufgeschlüsselt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: "Aktiv", value: stats?.activeSubscriptions || 0, color: "#10b981" },
                          { name: "Testphase", value: stats?.trialSubscriptions || 0, color: "#3b82f6" },
                          { name: "Gekündigt", value: stats?.canceledSubscriptions || 0, color: "#ef4444" },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: "Aktiv", value: stats?.activeSubscriptions || 0, color: "#10b981" },
                          { name: "Testphase", value: stats?.trialSubscriptions || 0, color: "#3b82f6" },
                          { name: "Gekündigt", value: stats?.canceledSubscriptions || 0, color: "#ef4444" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, "Abonnements"]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wichtige Kennzahlen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Jahresumsatz (ARR)</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.arr || 0)}</p>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  <Progress value={90} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Erstattungen</p>
                  <p className="text-2xl font-bold text-red-600">-{formatCurrency(stats?.totalRefunds || 0)}</p>
                  <Progress value={5} className="h-2 bg-red-100" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gesamtrabatte</p>
                  <p className="text-2xl font-bold text-amber-600">
                    -{formatCurrency((stats?.couponDiscounts || 0) + (stats?.customDiscounts || 0))}
                  </p>
                  <Progress value={15} className="h-2 bg-amber-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abonnements</CardTitle>
                  <CardDescription>Alle aktiven und inaktiven Abonnements</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preis/Monat</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Keine Abonnements gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.practice_name || `Praxis #${sub.practice_id}`}</p>
                              <p className="text-xs text-muted-foreground">{sub.practice_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.plan_name || "Standard"}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>{formatCurrency(sub.price_monthly || 0)}</TableCell>
                          <TableCell>
                            {sub.current_period_end && (
                              <span className="text-sm">bis {formatDateDE(sub.current_period_end)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPricingForm({ ...pricingForm, practiceId: sub.practice_id.toString() })
                                    setShowCustomPricingDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Sonderpreis
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Rechnung senden
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rabatt-Coupons</CardTitle>
                  <CardDescription>Erstellen und verwalten Sie Rabattcodes</CardDescription>
                </div>
                <Button onClick={() => setShowCouponDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Coupon
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Rabatt</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Einlösungen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Keine Coupons vorhanden. Erstellen Sie Ihren ersten Coupon!
                        </TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-medium">{coupon.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">{coupon.code}</code>
                              <Button variant="ghost" size="sm" onClick={() => handleCopyCode(coupon.code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.percent_off
                              ? `${coupon.percent_off}%`
                              : formatCurrency((coupon.amount_off || 0) / 100)}
                          </TableCell>
                          <TableCell>
                            {coupon.duration === "once"
                              ? "Einmalig"
                              : coupon.duration === "forever"
                                ? "Dauerhaft"
                                : `${coupon.duration_in_months} Monate`}
                          </TableCell>
                          <TableCell>
                            {coupon.times_redeemed}
                            {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.is_active ? "default" : "secondary"}>
                              {coupon.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Pricing Tab */}
        <TabsContent value="custom-pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Individuelle Preisgestaltung</CardTitle>
                  <CardDescription>Sonderkonditionen für einzelne Praxen (z.B. Großkunden, Partner)</CardDescription>
                </div>
                <Button onClick={() => setShowCustomPricingDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Sonderpreis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Sonderpreis/Monat</TableHead>
                      <TableHead>Rabatt</TableHead>
                      <TableHead>Grund</TableHead>
                      <TableHead>Gültig bis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customPricing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Keine individuellen Preise vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      customPricing.map((pricing) => (
                        <TableRow key={pricing.id}>
                          <TableCell className="font-medium">
                            {pricing.practice_name || `Praxis #${pricing.practice_id}`}
                          </TableCell>
                          <TableCell>
                            {pricing.custom_price_monthly ? formatCurrency(pricing.custom_price_monthly / 100) : "-"}
                          </TableCell>
                          <TableCell>{pricing.discount_percent ? `${pricing.discount_percent}%` : "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{pricing.discount_reason || "-"}</TableCell>
                          <TableCell>
                            {pricing.valid_until ? formatDateDE(pricing.valid_until) : "Unbegrenzt"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pricing.is_active ? "default" : "secondary"}>
                              {pricing.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Zahlungshistorie</CardTitle>
                  <CardDescription>Alle eingegangenen Zahlungen</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[250px]"
                    />
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zahlungsart</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Keine Zahlungen gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.paid_at ? formatDateDE(payment.paid_at) : formatDateDE(payment.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.practice_name || `Praxis #${payment.practice_id}`}
                          </TableCell>
                          <TableCell>
                            <span className={payment.refunded_amount > 0 ? "line-through text-muted-foreground" : ""}>
                              {formatCurrency(payment.amount / 100)}
                            </span>
                            {payment.refunded_amount > 0 && (
                              <span className="ml-2 text-red-600">
                                -{formatCurrency(payment.refunded_amount / 100)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>{payment.payment_method_type || "Karte"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {payment.receipt_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setShowPaymentDetailDialog(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuen Coupon erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie einen Rabattcode für Ihre Kunden</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-name">Name</Label>
                <Input
                  id="coupon-name"
                  placeholder="z.B. Sommersale"
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  placeholder="z.B. SOMMER24"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rabatttyp</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={couponForm.discountType === "percent"}
                    onChange={() => setCouponForm({ ...couponForm, discountType: "percent" })}
                  />
                  Prozent
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={couponForm.discountType === "amount"}
                    onChange={() => setCouponForm({ ...couponForm, discountType: "amount" })}
                  />
                  Fester Betrag
                </label>
              </div>
            </div>

            {couponForm.discountType === "percent" ? (
              <div className="space-y-2">
                <Label htmlFor="percent-off">Rabatt in %</Label>
                <Input
                  id="percent-off"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="z.B. 20"
                  value={couponForm.percentOff}
                  onChange={(e) => setCouponForm({ ...couponForm, percentOff: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="amount-off">Rabatt in €</Label>
                <Input
                  id="amount-off"
                  type="number"
                  min="1"
                  placeholder="z.B. 50"
                  value={couponForm.amountOff}
                  onChange={(e) => setCouponForm({ ...couponForm, amountOff: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Gültigkeit</Label>
              <Select
                value={couponForm.duration}
                onValueChange={(value: "once" | "repeating" | "forever") =>
                  setCouponForm({ ...couponForm, duration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Einmalig</SelectItem>
                  <SelectItem value="repeating">Wiederkehrend</SelectItem>
                  <SelectItem value="forever">Dauerhaft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {couponForm.duration === "repeating" && (
              <div className="space-y-2">
                <Label htmlFor="duration-months">Anzahl Monate</Label>
                <Input
                  id="duration-months"
                  type="number"
                  min="1"
                  placeholder="z.B. 3"
                  value={couponForm.durationMonths}
                  onChange={(e) => setCouponForm({ ...couponForm, durationMonths: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-redemptions">Max. Einlösungen</Label>
                <Input
                  id="max-redemptions"
                  type="number"
                  min="1"
                  placeholder="Unbegrenzt"
                  value={couponForm.maxRedemptions}
                  onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until">Gültig bis</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="first-purchase">Nur für Erstkunden</Label>
              <Switch
                id="first-purchase"
                checked={couponForm.firstPurchaseOnly}
                onCheckedChange={(checked) => setCouponForm({ ...couponForm, firstPurchaseOnly: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateCoupon}>Coupon erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Pricing Dialog */}
      <Dialog open={showCustomPricingDialog} onOpenChange={setShowCustomPricingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Individuellen Preis festlegen</DialogTitle>
            <DialogDescription>Legen Sie einen Sonderpreis für eine bestimmte Praxis fest</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="practice-id">Praxis ID</Label>
              <Input
                id="practice-id"
                type="number"
                placeholder="Praxis ID eingeben"
                value={pricingForm.practiceId}
                onChange={(e) => setPricingForm({ ...pricingForm, practiceId: e.target.value })}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-monthly">Sonderpreis/Monat (€)</Label>
                <Input
                  id="custom-monthly"
                  type="number"
                  min="0"
                  placeholder="z.B. 79"
                  value={pricingForm.customPriceMonthly}
                  onChange={(e) => setPricingForm({ ...pricingForm, customPriceMonthly: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-yearly">Sonderpreis/Jahr (€)</Label>
                <Input
                  id="custom-yearly"
                  type="number"
                  min="0"
                  placeholder="z.B. 790"
                  value={pricingForm.customPriceYearly}
                  onChange={(e) => setPricingForm({ ...pricingForm, customPriceYearly: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-percent">Oder: Rabatt in %</Label>
              <Input
                id="discount-percent"
                type="number"
                min="0"
                max="100"
                placeholder="z.B. 20"
                value={pricingForm.discountPercent}
                onChange={(e) => setPricingForm({ ...pricingForm, discountPercent: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-reason">Grund für Sonderpreis</Label>
              <Select
                value={pricingForm.discountReason}
                onValueChange={(value) => setPricingForm({ ...pricingForm, discountReason: value })}
              >
                <SelectTrigger id="discount-reason">
                  <SelectValue placeholder="Grund auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner / Kooperation</SelectItem>
                  <SelectItem value="volume">Mengenrabatt</SelectItem>
                  <SelectItem value="early-adopter">Early Adopter</SelectItem>
                  <SelectItem value="referral">Empfehlung</SelectItem>
                  <SelectItem value="nonprofit">Non-Profit / Sozial</SelectItem>
                  <SelectItem value="beta-tester">Beta-Tester</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-until-pricing">Gültig bis</Label>
              <Input
                id="valid-until-pricing"
                type="date"
                value={pricingForm.validUntil}
                onChange={(e) => setPricingForm({ ...pricingForm, validUntil: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leer lassen für unbegrenzte Gültigkeit</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Interne Notizen</Label>
              <Textarea
                id="notes"
                placeholder="Zusätzliche Informationen..."
                value={pricingForm.notes}
                onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomPricingDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateCustomPricing}>Sonderpreis speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={showPaymentDetailDialog} onOpenChange={setShowPaymentDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zahlungsdetails</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Praxis</p>
                  <p className="font-medium">
                    {selectedPayment.practice_name || `Praxis #${selectedPayment.practice_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Betrag</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount / 100)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="font-medium">
                    {selectedPayment.paid_at
                      ? formatDateDE(selectedPayment.paid_at)
                      : formatDateDE(selectedPayment.created_at)}
                  </p>
                </div>
                {selectedPayment.stripe_payment_intent_id && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Stripe Payment ID</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {selectedPayment.stripe_payment_intent_id}
                    </code>
                  </div>
                )}
              </div>
              {selectedPayment.failure_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Fehlergrund:</p>
                  <p className="text-sm text-red-600">{selectedPayment.failure_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDetailDialog(false)}>
              Schließen
            </Button>
            {selectedPayment?.receipt_url && (
              <Button asChild>
                <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Beleg anzeigen
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StripeBillingDashboard
