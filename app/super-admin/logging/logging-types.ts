import {
  AlertTriangle,
  Bug,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Monitor,
  Server,
  Globe,
  Zap,
  Database,
  Shield,
  Mail,
  Bot,
  Layers,
  Activity,
} from "lucide-react"

export interface ErrorLog {
  id: string
  created_at: string
  level: "debug" | "info" | "warn" | "error" | "critical"
  category: string
  message: string
  error_name: string | null
  error_message: string | null
  stack_trace: string | null
  source: string | null
  url: string | null
  method: string | null
  user_agent: string | null
  ip_address: string | null
  user_id: string | null
  practice_id: number | null
  request_id: string | null
  metadata: Record<string, any>
  status: "new" | "acknowledged" | "investigating" | "resolved" | "ignored"
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  fingerprint: string | null
}

export interface Stats {
  total: number
  byLevel: Record<string, number>
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  bySource: Record<string, number>
  last24h: number
  lastWeek: number
}

export const levelConfig = {
  debug: { icon: Bug, color: "text-slate-500", bg: "bg-slate-500/10", label: "Debug" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", label: "Info" },
  warn: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Warnung" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Fehler" },
  critical: { icon: XCircle, color: "text-red-700", bg: "bg-red-700/10", label: "Kritisch" },
}

export const statusConfig = {
  new: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Neu" },
  acknowledged: { icon: Eye, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Bestätigt" },
  investigating: { icon: Search, color: "text-blue-500", bg: "bg-blue-500/10", label: "In Bearbeitung" },
  resolved: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Gelöst" },
  ignored: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-400/10", label: "Ignoriert" },
}

export const categoryIcons: Record<string, any> = {
  api: Globe,
  database: Database,
  auth: Shield,
  ui: Monitor,
  email: Mail,
  ai: Bot,
  cron: Clock,
  middleware: Layers,
  security: Shield,
  performance: Zap,
  other: Activity,
}

export const sourceIcons: Record<string, any> = {
  client: Monitor,
  server: Server,
  api: Globe,
  cron: Clock,
}
