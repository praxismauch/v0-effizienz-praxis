import { NextResponse } from "next/server"

// Default cockpit card settings - table doesn't exist in database yet
const DEFAULT_SETTINGS = [
  { widget_id: "kpis", label: "KPIs", description: "Wichtige Kennzahlen", icon: "BarChart3", column_span: 2, row_span: 1, is_enabled_by_default: true, display_order: 1 },
  { widget_id: "tasks", label: "Aufgaben", description: "Offene Aufgaben", icon: "CheckSquare", column_span: 1, row_span: 1, is_enabled_by_default: true, display_order: 2 },
  { widget_id: "calendar", label: "Kalender", description: "Anstehende Termine", icon: "Calendar", column_span: 1, row_span: 1, is_enabled_by_default: true, display_order: 3 },
  { widget_id: "team", label: "Team", description: "Teamübersicht", icon: "Users", column_span: 1, row_span: 1, is_enabled_by_default: true, display_order: 4 },
  { widget_id: "documents", label: "Dokumente", description: "Neueste Dokumente", icon: "FileText", column_span: 1, row_span: 1, is_enabled_by_default: true, display_order: 5 },
]

// Public endpoint for users to get cockpit card settings
export async function GET() {
  // Return default settings since cockpit_card_settings table doesn't exist
  return NextResponse.json({ settings: DEFAULT_SETTINGS })
}
