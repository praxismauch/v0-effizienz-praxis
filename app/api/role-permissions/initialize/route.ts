import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"
import type { NormalizedRoleKey } from "@/lib/roles"

// All 7 roles from the role configuration
const ALL_ROLES: NormalizedRoleKey[] = ["superadmin", "practiceadmin", "admin", "manager", "member", "viewer", "extern"]

// Permission definitions with access levels per role
// [can_view, can_create, can_edit, can_delete]
interface PermissionDef {
  key: string
  category: string
  superadmin: boolean[]
  practiceadmin: boolean[]
  admin: boolean[]
  manager: boolean[]
  member: boolean[]
  viewer: boolean[]
  extern: boolean[]
}

const permissionDefinitions: PermissionDef[] = [
  // Übersicht
  {
    key: "dashboard",
    category: "Übersicht",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, false],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "analytics",
    category: "Übersicht",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, false],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Praxismanagement
  {
    key: "leitbild",
    category: "Praxismanagement",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "wunschpatient",
    category: "Praxismanagement",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "profile",
    category: "Praxismanagement",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, false],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Team & Personal
  {
    key: "team",
    category: "Team & Personal",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "hiring",
    category: "Team & Personal",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [false, false, false, false],
    viewer: [false, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "training",
    category: "Team & Personal",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, true, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "skills",
    category: "Team & Personal",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "responsibilities",
    category: "Team & Personal",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Planung & Organisation
  {
    key: "calendar",
    category: "Planung & Organisation",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, true, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "tasks",
    category: "Planung & Organisation",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, true, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "goals",
    category: "Planung & Organisation",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "workflows",
    category: "Planung & Organisation",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Daten & Dokumente
  {
    key: "documents",
    category: "Daten & Dokumente",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "knowledge",
    category: "Daten & Dokumente",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "contacts",
    category: "Daten & Dokumente",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, true, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "kpi",
    category: "Daten & Dokumente",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Infrastruktur
  {
    key: "rooms",
    category: "Infrastruktur",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "workplaces",
    category: "Infrastruktur",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "equipment",
    category: "Infrastruktur",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Finanzen & Abrechnung
  {
    key: "billing",
    category: "Finanzen & Abrechnung",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, false, false, false],
    member: [false, false, false, false],
    viewer: [false, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "reports",
    category: "Finanzen & Abrechnung",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, false],
    manager: [true, false, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },

  // Administration
  {
    key: "settings",
    category: "Administration",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, false, true, false],
    manager: [true, false, false, false],
    member: [false, false, false, false],
    viewer: [false, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "security",
    category: "Administration",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, false, true, false],
    manager: [false, false, false, false],
    member: [false, false, false, false],
    viewer: [false, false, false, false],
    extern: [false, false, false, false],
  },
  {
    key: "user_management",
    category: "Administration",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, false],
    manager: [true, false, false, false],
    member: [false, false, false, false],
    viewer: [false, false, false, false],
    extern: [false, false, false, false],
  },

  // Qualitätsmanagement
  {
    key: "qm",
    category: "Qualitätsmanagement",
    superadmin: [true, true, true, true],
    practiceadmin: [true, true, true, true],
    admin: [true, true, true, true],
    manager: [true, true, false, false],
    member: [true, false, false, false],
    viewer: [true, false, false, false],
    extern: [false, false, false, false],
  },
]

export async function POST() {
  try {
    const supabase = await createClient()

    const isPreview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development"

    if (!isPreview) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("No authenticated user found")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userError || !isSuperAdminRole(userData?.role)) {
        console.error("User is not a super admin")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const adminClient = await createAdminClient()

    // Generate permissions for all 7 roles
    const defaultPermissions: {
      role: NormalizedRoleKey
      permission_key: string
      permission_category: string
      can_view: boolean
      can_create: boolean
      can_edit: boolean
      can_delete: boolean
    }[] = []

    for (const def of permissionDefinitions) {
      for (const role of ALL_ROLES) {
        const perms = def[role]
        defaultPermissions.push({
          role,
          permission_key: def.key,
          permission_category: def.category,
          can_view: perms[0],
          can_create: perms[1],
          can_edit: perms[2],
          can_delete: perms[3],
        })
      }
    }

    const { data, error } = await adminClient
      .from("role_permissions")
      .upsert(defaultPermissions, {
        onConflict: "role,permission_key",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error("Error inserting permissions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        count: defaultPermissions.length,
        rolesCount: ALL_ROLES.length,
        permissionsPerRole: permissionDefinitions.length,
        message: `Berechtigungen für ${ALL_ROLES.length} Rollen initialisiert (${defaultPermissions.length} Einträge)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in initialize permissions API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
