import type { NavigationGroup } from "@/lib/sidebar-navigation"

/**
 * Maps sidebar navigation keys to permission_key in role_permissions table
 */
export const SIDEBAR_TO_PERMISSION_KEY: Record<string, string> = {
  dashboard: "dashboard",
  aiAnalysis: "ai_analysis",
  academy: "academy",
  calendar: "calendar",
  dienstplan: "dienstplan",
  zeiterfassung: "zeiterfassung",
  tasks: "tasks",
  goals: "goals",
  workflows: "workflows",
  responsibilities: "responsibilities",
  analytics: "analytics",
  documents: "documents",
  journal: "practice_journals",
  knowledge: "knowledge",
  protocols: "protocols",
  cirs: "cirs",
  hygieneplan: "hygieneplan",
  strategy_journey: "strategy_journey",
  leadership: "leadership",
  wellbeing: "wellbeing",
  leitbild: "leitbild",
  roi_analysis: "roi_analysis",
  igel: "igel_analysis",
  competitor_analysis: "competitor_analysis",
  wunschpatient: "wunschpatient",
  hiring: "hiring",
  team: "team",
  mitarbeitergespraeche: "mitarbeitergespraeche",
  selbst_check: "selbst_check",
  skills: "skills",
  organigramm: "organigramm",
  training: "training",
  contacts: "contacts",
  surveys: "surveys",
  arbeitsplaetze: "arbeitsplaetze",
  rooms: "rooms",
  arbeitsmittel: "arbeitsmittel",
  inventory: "inventory",
  devices: "devices",
  settings: "settings",
}

/**
 * Build sidebar permissions map from navigation groups and a permission checker
 */
export function buildSidebarPermissions(
  groups: NavigationGroup[],
  checkPermission: (key: string, action: string) => boolean,
): Record<string, boolean> {
  const permissions: Record<string, boolean> = {}
  for (const group of groups) {
    for (const item of group.items) {
      if (item.key) {
        const permKey = SIDEBAR_TO_PERMISSION_KEY[item.key] || item.key
        permissions[item.key] = checkPermission(permKey, "can_view")
      }
    }
  }
  return permissions
}
