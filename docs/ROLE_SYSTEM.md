# Role System Documentation

## Overview
The Effizienz Praxis system uses a hierarchical role-based access control (RBAC) system with 7 core roles plus legacy support.

## Valid Database Roles

The `users` table accepts the following roles through a CHECK constraint:

### Primary Roles (Application Standard)

### 1. Super Admin (`superadmin`)
- **Hierarchy Level:** 100 (highest)
- **Description:** Vollzugriff auf alle Systeme und Praxen (Full system access)
- **Access:** Full system access across all practices
- **Color:** Red badge
- **German:** Super Administrator

### 2. Practice Admin (`practiceadmin`)
- **Hierarchy Level:** 80
- **Aliases:** Praxis Admin, Practice Administrator
- **Description:** Administrator einer Praxis mit voller Kontrolle
- **Access:** Full control over their assigned practice
- **Color:** Purple badge
- **German:** Praxisadmin

### 3. Admin (`admin`)
- **Hierarchy Level:** 70
- **Description:** Administrativer Zugriff
- **Access:** Administrative access within practice
- **Color:** Indigo badge
- **German:** Administrator

### 4. Manager (`manager`)
- **Hierarchy Level:** 60
- **Description:** Erweiterte Berechtigungen für Teamführung (Extended permissions)
- **Access:** Extended permissions for team management
- **Color:** Blue badge
- **German:** Manager

### 5. Member (`member`)
- **Hierarchy Level:** 40
- **Description:** Standardbenutzer mit normalen Funktionen
- **Access:** Standard user with normal functionality
- **Color:** Green badge
- **German:** Mitglied
- **⭐ DEFAULT ROLE FOR NEW USERS**

### 6. Viewer (`viewer`)
- **Hierarchy Level:** 20
- **Aliases:** Betrachter
- **Description:** Nur-Lese-Zugriff
- **Access:** Read-only access
- **Color:** Gray badge
- **German:** Betrachter

### 7. Extern (`extern`)
- **Hierarchy Level:** 10
- **Description:** Eingeschränkter externer Zugriff
- **Access:** Limited external access
- **Color:** Orange badge
- **German:** Extern

### Legacy Roles (Supported for Backwards Compatibility)

- **`user`** → Use `member` instead (legacy alias)
- **`poweruser`** → Use `manager` instead (legacy alias)

## Database Storage

In Supabase `users` table, the `role` column has this CHECK constraint:
```sql
CHECK (role = ANY (ARRAY[
  'superadmin'::text, 
  'practiceadmin'::text, 
  'admin'::text,
  'manager'::text,
  'member'::text,
  'viewer'::text,
  'extern'::text,
  'user'::text,      -- legacy
  'poweruser'::text   -- legacy
]))
```

**This means:**
- ✅ All 7 primary roles are valid: `superadmin`, `practiceadmin`, `admin`, `manager`, `member`, `viewer`, `extern`
- ✅ Legacy roles are supported: `user`, `poweruser`
- ❌ Any other value (like `doctor`, `nurse`, `staff`) will cause an INSERT/UPDATE error
- Type: TEXT with CHECK constraint
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
