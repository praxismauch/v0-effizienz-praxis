# Role System Documentation

## Overview
The Effizienz Praxis system uses a hierarchical role-based access control (RBAC) system with 7 distinct roles. All role logic is centralized in `/lib/roles.ts` and `/lib/auth-utils.ts`.

## Valid Roles

### 1. Super Admin (`superadmin`)
- **Hierarchy Level:** 100 (highest)
- **Aliases:** `super_admin`
- **Description:** Vollzugriff auf alle Systeme und Praxen
- **Access:** Full system access across all practices
- **Color:** Red badge
- **Icon:** Shield

### 2. Praxis Admin (`practiceadmin`)
- **Hierarchy Level:** 80
- **Aliases:** `practice_admin`
- **Description:** Administrator einer Praxis mit voller Kontrolle
- **Access:** Full control over their assigned practice
- **Color:** Purple badge
- **Icon:** UserCheck

### 3. Admin (`admin`)
- **Hierarchy Level:** 70
- **Description:** Administrativer Zugriff (ähnlich wie Praxis Admin)
- **Access:** Administrative access (similar to practice admin)
- **Color:** Indigo badge
- **Icon:** UserCheck

### 4. Manager (`manager`)
- **Hierarchy Level:** 60
- **Aliases:** `poweruser` (legacy)
- **Description:** Erweiterte Berechtigungen für Teamführung
- **Access:** Extended permissions for team management
- **Color:** Blue badge
- **Icon:** UserCog

### 5. Mitglied (`member`)
- **Hierarchy Level:** 40
- **Aliases:** `user` (legacy), `mitglied`
- **Description:** Standardbenutzer mit normalen Funktionen
- **Access:** Standard user with normal functionality
- **Color:** Green badge
- **Icon:** Users
- **DEFAULT ROLE FOR NEW USERS**

### 6. Betrachter (`viewer`)
- **Hierarchy Level:** 20
- **Aliases:** `betrachter`
- **Description:** Nur-Lese-Zugriff auf freigegebene Bereiche
- **Access:** Read-only access to shared areas
- **Color:** Gray badge
- **Icon:** Eye

### 7. Extern (`extern`)
- **Hierarchy Level:** 10 (lowest)
- **Description:** Eingeschränkter externer Zugriff
- **Access:** Limited external access
- **Color:** Orange badge
- **Icon:** UserX

## Database Storage

In Supabase `users` table, the `role` column stores the normalized role key:
- Values: `superadmin`, `practiceadmin`, `admin`, `manager`, `member`, `viewer`, `extern`
- Type: TEXT (enum in TypeScript)
- Default: `member`

## Usage in Code

### Import Utilities
```typescript
import { 
  isSuperAdminRole, 
  isPracticeAdminRole, 
  isManagerRole,
  isMemberRole,
  isViewerRole,
  normalizeRole,
  requireSuperAdmin,
  requirePracticeAdmin,
  requireManager,
  requireMember
} from "@/lib/auth-utils"

import {
  ROLE_CONFIG,
  AVAILABLE_ROLES,
  getRoleConfig,
  getRoleLabel,
  getRoleBadgeColor,
  hasHigherOrEqualHierarchy,
  canManageRole
} from "@/lib/roles"
```

### Check Role Permissions
```typescript
// Check if user is super admin
if (isSuperAdminRole(user.role)) {
  // Allow super admin access
}

// Check if user has at least manager role
if (isManagerRole(user.role)) {
  // Includes: superadmin, practiceadmin, admin, manager
}

// Check if user can manage another user
if (canManageRole(currentUser.role, targetUser.role)) {
  // Allow role management
}
```

### Require Specific Roles in API Routes
```typescript
import { requireSuperAdmin, requirePracticeAdmin } from "@/lib/auth-utils"

// Require super admin
const user = await requireSuperAdmin()

// Require practice admin (or higher)
const user = await requirePracticeAdmin(practiceId)

// Require manager (or higher) 
const user = await requireManager(practiceId)

// Require member (or higher)
const user = await requireMember(practiceId)
```

### Display Role Badges
```typescript
import { getRoleLabel, getRoleBadgeColor } from "@/lib/roles"

<Badge className={getRoleBadgeColor(user.role)}>
  {getRoleLabel(user.role)}
</Badge>
```

### Role Dropdowns
```typescript
import { AVAILABLE_ROLES } from "@/lib/roles"

<Select>
  {AVAILABLE_ROLES.map(role => (
    <SelectItem key={role.value} value={role.value}>
      {role.label}
    </SelectItem>
  ))}
</Select>
```

## Authentication Flows

### 1. New User Registration (`/api/auth/ensure-profile`)
- Creates user with default role: `member`
- Also creates team_members entry if practice is assigned

### 2. Login (`/api/auth/login`)
- Creates user record if doesn't exist
- Default role: `member`
- Uses metadata role if provided

### 3. User Updates (`/api/super-admin/users/[id]`)
- Only super admin can change roles
- Role changes validated against hierarchy
- Updates both users and team_members tables

## Role Hierarchy

The hierarchy determines permissions:
```
superadmin (100)      ← Can manage everyone
  ↓
practiceadmin (80)    ← Can manage admin and below
  ↓
admin (70)            ← Can manage manager and below
  ↓
manager (60)          ← Can manage member and below
  ↓
member (40)           ← Standard access
  ↓
viewer (20)           ← Read-only
  ↓
extern (10)           ← Minimal access
```

## Common Mistakes to Avoid

### ❌ DON'T USE
- `"user"` - This is a legacy alias, use `"member"` instead
- `"doctor"` - Not a valid role
- `"staff"` - Not a valid role  
- `"super_admin"` in DB - Use `"superadmin"` (normalized)
- `"practice_admin"` in DB - Use `"practiceadmin"` (normalized)

### ✅ DO USE
- `"member"` - For standard users
- `"manager"` - For team leaders
- `"practiceadmin"` - For practice administrators
- `"superadmin"` - For system administrators
- Always use `normalizeRole()` when processing role strings
- Use helper functions like `isSuperAdminRole()` for checks

## Migration Notes

If you have existing data with invalid roles:
1. `"user"` → `"member"`
2. `"doctor"` → `"member"` or `"manager"` (depending on responsibilities)
3. `"staff"` → `"member"`
4. `"poweruser"` → `"manager"`
5. `"super_admin"` → `"superadmin"`
6. `"practice_admin"` → `"practiceadmin"`

## Testing

When creating test users or seeding data:
```typescript
// ✅ Correct
{ role: "member" }
{ role: "manager" }
{ role: "practiceadmin" }
{ role: "superadmin" }

// ❌ Incorrect
{ role: "user" }
{ role: "doctor" }
{ role: "staff" }
```

## See Also
- `/lib/roles.ts` - Role configuration and utilities
- `/lib/auth-utils.ts` - Authentication and authorization helpers
- `/docs/DATABASE_SCHEMA.md` - Database structure
