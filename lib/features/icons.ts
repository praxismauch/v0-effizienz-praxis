import type React from "react"
import {
  Brain, TrendingUp, BarChart3, Users, Layers, GraduationCap, Briefcase, Network,
  Calendar, CheckSquare, Target, Workflow, ClipboardList, BookOpen, FolderOpen,
  Mic, Phone, Map, Heart, Lightbulb, Search, UserPlus, Star, DoorOpen, Package,
  MonitorCheck, Pin, Settings, FileText, LayoutDashboard, PieChart, Clock, Shield,
  Zap, Bell, LineChart, ClipboardCheck, PackageSearch, Shuffle, Smile, MessageSquare,
  HelpCircle, Bot, Video, Keyboard, Inbox, Send, Reply, Archive, ListChecks,
  Download, Activity, ThumbsUp, ArrowRightLeft, AlertTriangle, ShoppingCart, Scan,
  CalendarClock, ShieldCheck, ShieldAlert, BookOpenCheck, Crown, Cpu, Stethoscope,
  HeartPulse, Gauge, UserCheck,
} from "lucide-react"

export const FEATURE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, TrendingUp, BarChart3, Users, Layers, GraduationCap, Briefcase, Network,
  Calendar, CheckSquare, Target, Workflow, ClipboardList, BookOpen, FolderOpen,
  Mic, Phone, Map, Heart, Lightbulb, Search, UserPlus, Star, DoorOpen, Package,
  MonitorCheck, Pin, Settings, FileText, LayoutDashboard, PieChart, Clock, Shield,
  Zap, Bell, LineChart, ClipboardCheck, PackageSearch, Shuffle, Smile, MessageSquare,
  HelpCircle, Bot, Video, Keyboard, Inbox, Send, Reply, Archive, ListChecks,
  Download, Activity, ThumbsUp, ArrowRightLeft, AlertTriangle, ShoppingCart, Scan,
  CalendarClock, ShieldCheck, ShieldAlert, BookOpenCheck, Crown, Cpu, Stethoscope,
  HeartPulse, Gauge, UserCheck,
}

export function getFeatureIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return FEATURE_ICON_MAP[iconName] || Brain
}
