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
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-currency"
import { formatDateDE } from "@/lib/utils"
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Trash2,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

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

interface StripeBillingDashboardProps {
  initialTab?: string
  hideStats?: boolean
}

export function StripeBillingDashboard({ initialTab = "overview", hideStats = false }: StripeBillingDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
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
      // Load coupons
      const couponsRes = await fetch("/api/super-admin/stripe/coupons")
      if (couponsRes.ok) {
        const data = await couponsRes.json()
        setCoupons(data.coupons || [])
      }

      // Load custom pricing
      const pricingRes = await fetch("/api/super-admin/stripe/custom-pricing")
      if (pricingRes.ok) {
        const data = await pricingRes.json()
        setCustomPricing(data.pricing || [])
      }

      // Load payments
      const paymentsRes = await fetch("/api/super-admin/stripe/payments")
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data.payments || [])
      }

      // Load subscriptions
      const subsRes = await fetch("/api/super-admin/stripe/subscriptions")
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubscriptions(data.subscriptions || [])
      }

      // Load stats only if not hidden
      if (!hideStats) {
        const statsRes = await fetch("/api/super-admin/stripe/stats")
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
          setRevenueData(data.revenueData || [])
        }
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
  }, [hideStats])

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
        await loadData()
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
        await loadData()
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
        await loadData()
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
        await loadData()
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

  if (hideStats) {
    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSyncStripe} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Synchronisieren
            </Button>
            {initialTab === "coupons" && (
              <Button onClick={() => setShowCouponDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Coupon
              </Button>
            )}
          </div>
        </div>

        {/* Content based on initialTab */}
        {initialTab === "overview" && (
          <div className="space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Umsatzentwicklung</CardTitle>
                <CardDescription>Monatlicher Umsatz der letzten 12 Monate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(stats?.totalRevenue || 0)}</div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rabatte gewährt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    -{formatCurrency((stats?.couponDiscounts || 0) + (stats?.customDiscounts || 0))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Erstattungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">-{formatCurrency(stats?.totalRefunds || 0)}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {initialTab === "subscriptions" && (
          <Card>
            <CardHeader>
              <CardTitle>Alle Abonnements</CardTitle>
              <CardDescription>{filteredSubscriptions.length} Abonnements gefunden</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Praxis</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preis</TableHead>
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
                            <div className="font-medium">{sub.practice_name || "Unbekannt"}</div>
                            <div className="text-sm text-muted-foreground">{sub.practice_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{sub.plan_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>{sub.price_monthly ? formatCurrency(sub.price_monthly) + "/Mo" : "-"}</TableCell>
                        <TableCell>
                          {sub.current_period_end ? formatDateDE(sub.current_period_end) : "-"}
                          {sub.cancel_at_period_end && (
                            <Badge variant="outline" className="ml-2">
                              Endet
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {initialTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Alle Transaktionen</CardTitle>
              <CardDescription>{filteredPayments.length} Zahlungen gefunden</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Praxis</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Methode</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Keine Transaktionen gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paid_at ? formatDateDE(payment.paid_at) : formatDateDE(payment.created_at)}
                        </TableCell>
                        <TableCell>{payment.practice_name || "Unbekannt"}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.payment_method_type || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {payment.receipt_url && (
                                <DropdownMenuItem onClick={() => window.open(payment.receipt_url, "_blank")}>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Beleg anzeigen
                                </DropdownMenuItem>
                              )}
                              {payment.invoice_pdf_url && (
                                <DropdownMenuItem onClick={() => window.open(payment.invoice_pdf_url, "_blank")}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Rechnung herunterladen
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {initialTab === "coupons" && (
          <div className="space-y-6">
            {/* Coupons Table */}
            <Card>
              <CardHeader>
                <CardTitle>Aktive Coupons</CardTitle>
                <CardDescription>{coupons.filter((c) => c.is_active).length} aktive Coupons</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Rabatt</TableHead>
                      <TableHead>Einlösungen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Keine Coupons vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-medium">{coupon.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">{coupon.code}</code>
                              <Button variant="ghost" size="icon" onClick={() => handleCopyCode(coupon.code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.percent_off ? `${coupon.percent_off}%` : formatCurrency(coupon.amount_off || 0)}
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
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Custom Pricing Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Individuelle Preise</CardTitle>
                  <CardDescription>Sonderpreise für bestimmte Praxen</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowCustomPricingDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Sonderpreis
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Monatspreis</TableHead>
                      <TableHead>Jahrespreis</TableHead>
                      <TableHead>Rabatt</TableHead>
                      <TableHead>Gültig bis</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customPricing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                            {pricing.custom_price_monthly ? formatCurrency(pricing.custom_price_monthly) : "-"}
                          </TableCell>
                          <TableCell>
                            {pricing.custom_price_yearly ? formatCurrency(pricing.custom_price_yearly) : "-"}
                          </TableCell>
                          <TableCell>{pricing.discount_percent ? `${pricing.discount_percent}%` : "-"}</TableCell>
                          <TableCell>
                            {pricing.valid_until ? formatDateDE(pricing.valid_until) : "Unbegrenzt"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pricing.is_active ? "default" : "secondary"}>
                              {pricing.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coupon Dialog */}
        <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neuen Coupon erstellen</DialogTitle>
              <DialogDescription>Erstellen Sie einen neuen Rabattcode</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                  placeholder="z.B. Sommer-Rabatt"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="z.B. SOMMER2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Rabattart</Label>
                <Select
                  value={couponForm.discountType}
                  onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v as "percent" | "amount" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Prozent</SelectItem>
                    <SelectItem value="amount">Festbetrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {couponForm.discountType === "percent" ? (
                <div className="space-y-2">
                  <Label>Rabatt (%)</Label>
                  <Input
                    type="number"
                    value={couponForm.percentOff}
                    onChange={(e) => setCouponForm({ ...couponForm, percentOff: e.target.value })}
                    placeholder="z.B. 20"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Rabatt (EUR)</Label>
                  <Input
                    type="number"
                    value={couponForm.amountOff}
                    onChange={(e) => setCouponForm({ ...couponForm, amountOff: e.target.value })}
                    placeholder="z.B. 50"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Aktiv</Label>
                <Switch
                  checked={couponForm.isActive}
                  onCheckedChange={(v) => setCouponForm({ ...couponForm, isActive: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateCoupon}>Erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Pricing Dialog */}
        <Dialog open={showCustomPricingDialog} onOpenChange={setShowCustomPricingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Individuellen Preis erstellen</DialogTitle>
              <DialogDescription>Sonderpreis für eine bestimmte Praxis</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Praxis-ID</Label>
                <Input
                  type="number"
                  value={pricingForm.practiceId}
                  onChange={(e) => setPricingForm({ ...pricingForm, practiceId: e.target.value })}
                  placeholder="z.B. 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Monatspreis (EUR)</Label>
                <Input
                  type="number"
                  value={pricingForm.customPriceMonthly}
                  onChange={(e) => setPricingForm({ ...pricingForm, customPriceMonthly: e.target.value })}
                  placeholder="z.B. 49"
                />
              </div>
              <div className="space-y-2">
                <Label>Jahrespreis (EUR)</Label>
                <Input
                  type="number"
                  value={pricingForm.customPriceYearly}
                  onChange={(e) => setPricingForm({ ...pricingForm, customPriceYearly: e.target.value })}
                  placeholder="z.B. 490"
                />
              </div>
              <div className="space-y-2">
                <Label>Grund</Label>
                <Textarea
                  value={pricingForm.discountReason}
                  onChange={(e) => setPricingForm({ ...pricingForm, discountReason: e.target.value })}
                  placeholder="Grund für den Sonderpreis"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomPricingDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateCustomPricing}>Erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Original full component with internal tabs (fallback)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stripe Zahlungsverwaltung</h2>
          <p className="text-muted-foreground">Vollständige Übersicht über Abonnements, Zahlungen und Rabatte</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncStripe} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Mit Stripe synchronisieren
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="payments">Transaktionen</TabsTrigger>
          <TabsTrigger value="coupons">Rabatte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Bitte nutzen Sie die Hauptnavigation für die Zahlungsverwaltung.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StripeBillingDashboard
