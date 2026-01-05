# Effizienz Praxis - Design System

## Overview
This document defines the design system used across the Effizienz Praxis application. All components and pages should follow these guidelines for consistency.

## Color Palette

### Primary Colors
\`\`\`css
--primary: hsl(220 80% 50%)           /* Blue - Main actions, links */
--primary-foreground: hsl(0 0% 100%)  /* White text on primary */
--background: hsl(220 20% 98%)        /* Light gray background */
--foreground: hsl(220 20% 10%)        /* Dark text */
\`\`\`

### Semantic Colors
\`\`\`css
--success: hsl(140 60% 40%)           /* Green - Success states */
--destructive: hsl(0 70% 50%)         /* Red - Errors, delete */
--warning: hsl(40 90% 50%)            /* Yellow - Warnings */
--muted: hsl(220 15% 95%)             /* Light gray - Muted text */
--muted-foreground: hsl(220 10% 45%)  /* Medium gray text */
\`\`\`

### Sidebar Colors
\`\`\`css
--sidebar: hsl(220 50% 20%)           /* Dark blue sidebar */
--sidebar-accent: hsl(220 40% 30%)    /* Lighter blue accent */
--sidebar-foreground: hsl(0 0% 95%)   /* Light text on sidebar */
\`\`\`

### Status & Priority Colors
**Tailwind Classes:**
- Urgent/Critical: `bg-red-100 text-red-800 border-red-200`
- High Priority: `bg-orange-100 text-orange-800 border-orange-200`
- Medium/Normal: `bg-yellow-100 text-yellow-800 border-yellow-200`
- Low Priority: `bg-green-100 text-green-800 border-green-200`
- Completed: `bg-emerald-100 text-emerald-800`
- Active/Open: `bg-blue-100 text-blue-800`
- Draft/Pending: `bg-gray-100 text-gray-800`
- Inactive: `bg-slate-100 text-slate-600`

## Typography

### Font Families
- **Primary Font:** Inter (sans-serif) - Used for all UI text
- **Monospace Font:** JetBrains Mono - Used for code, IDs, technical data

### Text Hierarchy
\`\`\`tsx
// Page Titles
<h1 className="text-3xl font-bold">Page Title</h1>

// Section Headings
<h2 className="text-2xl font-semibold">Section Title</h2>

// Card/Component Titles
<h3 className="text-lg font-medium">Card Title</h3>

// Body Text
<p className="text-sm">Regular content text</p>

// Meta/Secondary Text
<span className="text-sm text-muted-foreground">Created by John Doe</span>

// Small Labels
<label className="text-xs font-medium">Label</label>
\`\`\`

## Layout Structure

### Standard Page Layout
\`\`\`tsx
<SidebarProvider>
  <div className="flex h-screen bg-background">
    <MedicalSidebar />
    <div className="flex-1 flex flex-col">
      <MedicalHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Page content */}
        </div>
      </main>
    </div>
  </div>
</SidebarProvider>
\`\`\`

### Page Header Pattern
\`\`\`tsx
<div className="space-y-6">
  {/* Title Section */}
  <div className="flex items-start justify-between">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">
        Descriptive subtitle or page description
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline">Secondary Action</Button>
      <Button>Primary Action</Button>
    </div>
  </div>

  {/* Stats/Metrics Grid */}
  <div className="grid gap-4 md:grid-cols-4">
    <StatCard icon={Icon} label="Metric" value="123" />
  </div>

  {/* Filters/Search */}
  <div className="flex items-center gap-4">
    <Input placeholder="Search..." className="max-w-md" />
    <DropdownMenu>...</DropdownMenu>
  </div>

  {/* Content Area */}
  <div className="space-y-4">
    {/* Cards, lists, tables, etc. */}
  </div>
</div>
\`\`\`

## Spacing System

### Standard Spacing Scale (Tailwind)
- `gap-2` (8px) - Small gaps between inline elements (buttons, badges)
- `gap-4` (16px) - Grid gaps, card spacing
- `gap-6` (24px) - Large section gaps
- `space-y-2` (8px) - Tight vertical spacing within components
- `space-y-4` (16px) - Normal vertical spacing
- `space-y-6` (24px) - Section-level vertical spacing
- `p-4` (16px) - Card padding
- `p-6` (24px) - Page/main content padding

### Layout Rules
1. **Page Container:** Always use `p-6` for main content area
2. **Section Spacing:** Use `space-y-6` between major sections
3. **Component Spacing:** Use `space-y-4` within components
4. **Grid Gaps:** Use `gap-4` for card grids
5. **Button Groups:** Use `gap-2` for action buttons

## Component Patterns

### Cards
\`\`\`tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
\`\`\`

### Stat Cards
\`\`\`tsx
<Card>
  <CardContent className="p-6">
    <div className="flex items-center gap-4">
      <div className="rounded-full p-3 bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  </CardContent>
</Card>
\`\`\`

### Status Badges
\`\`\`tsx
// Interactive Badge with Dropdown
<DropdownMenu>
  <DropdownMenuTrigger>
    <Badge className="cursor-pointer hover:bg-primary/90">
      {status}
      <ChevronDown className="ml-1 h-3 w-3" />
    </Badge>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Options */}
  </DropdownMenuContent>
</DropdownMenu>

// Static Badge
<Badge variant="outline">{label}</Badge>
\`\`\`

### Priority Badges
\`\`\`tsx
// Use consistent colors with icons
<Badge className="bg-red-100 text-red-800 border border-red-200">
  ⚠ Dringend
</Badge>
<Badge className="bg-orange-100 text-orange-800 border border-orange-200">
  ↑ Hoch
</Badge>
<Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
  − Mittel
</Badge>
<Badge className="bg-green-100 text-green-800 border border-green-200">
  ↓ Niedrig
</Badge>
\`\`\`

### Buttons
\`\`\`tsx
// Primary Action
<Button>Speichern</Button>

// Secondary Action
<Button variant="outline">Abbrechen</Button>

// Destructive Action
<Button variant="destructive">Löschen</Button>

// Ghost (minimal)
<Button variant="ghost">Details</Button>

// AI Action (special gradient)
<Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
  <Sparkles className="mr-2 h-4 w-4" />
  KI-Vorschläge
</Button>
\`\`\`

### Tabs
\`\`\`tsx
<Tabs defaultValue="all">
  <TabsList className="grid grid-cols-4 w-full">
    <TabsTrigger value="all" className="gap-2">
      Alle
      <Badge variant="outline">{count}</Badge>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="all">
    {/* Content */}
  </TabsContent>
</Tabs>
\`\`\`

### Empty States
\`\`\`tsx
<Card className="col-span-full">
  <CardContent className="flex flex-col items-center justify-center py-12">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">Keine Einträge gefunden</h3>
    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
      Beschreibung was der Benutzer tun kann
    </p>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Erstellen
    </Button>
  </CardContent>
</Card>
\`\`\`

### Search & Filters
\`\`\`tsx
<div className="flex items-center gap-4">
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Suchen..."
      className="pl-10"
    />
  </div>
  
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        <Filter className="mr-2 h-4 w-4" />
        Filter
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {/* Filter options */}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
\`\`\`

### Loading States
\`\`\`tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>
\`\`\`

## Border Radius
- Default: `rounded-md` (0.375rem / 6px)
- Cards: `rounded-lg` (0.5rem / 8px)
- Pills/Badges: `rounded-full`
- Buttons: `rounded-md`

## Shadows
\`\`\`css
/* Subtle elevation */
shadow-sm

/* Card hover state */
hover:shadow-md

/* Active/Focused state */
shadow-lg

/* Always use smooth transitions */
transition-shadow duration-200
\`\`\`

## Transitions
Standard transition for all interactive elements:
\`\`\`tsx
className="transition-all duration-200"
\`\`\`

## Icons
- **Size:** Use `h-4 w-4` for inline icons, `h-5 w-5` for larger contexts
- **Library:** Lucide React
- **Consistency:** Always place icon before text with `mr-2` spacing

## Responsive Design

### Breakpoints (Tailwind)
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

### Common Patterns
\`\`\`tsx
// 1 column on mobile, 2 on tablet, 4 on desktop
className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"

// Hidden on mobile, visible on desktop
className="hidden md:block"

// Full width on mobile, max width on desktop
className="w-full md:max-w-md"
\`\`\`

## Accessibility

### Always Include:
1. **Alt text** for images
2. **Aria labels** for icon-only buttons
3. **Focus states** (automatic with shadcn components)
4. **Semantic HTML** (proper heading hierarchy)
5. **Keyboard navigation** support

### Example:
\`\`\`tsx
<Button aria-label="Benutzer löschen">
  <Trash2 className="h-4 w-4" />
</Button>
\`\`\`

## Dark Mode Support
All components use CSS variables that automatically adapt to dark mode via the `.dark` class on `<html>`. No special handling needed in most cases.

## Best Practices

1. **Consistency First:** Always check existing components before creating new patterns
2. **Mobile First:** Design for mobile, enhance for desktop
3. **Performance:** Use `transition-*` sparingly, only on user-interactive elements
4. **Accessibility:** Test with keyboard navigation and screen readers
5. **Semantic HTML:** Use proper heading hierarchy (h1 → h2 → h3)
6. **Color Contrast:** Ensure text meets WCAG AA standards (4.5:1 ratio minimum)
7. **Loading States:** Always show skeleton or spinner during async operations
8. **Error States:** Provide clear, actionable error messages
9. **Empty States:** Guide users with clear CTAs when no data exists
10. **Confirmation Dialogs:** Always confirm destructive actions

## German Language Conventions

- Use formal "Sie" form in all UI text
- Button labels: Imperativ form (Speichern, Löschen, Bearbeiten)
- Messages: Complete sentences with proper punctuation
- Dates: DD.MM.YYYY format (e.g., 16.12.2025)
- Times: 24-hour format (e.g., 14:30 Uhr)

## File Organization

\`\`\`
app/
  [page]/
    page.tsx           # Server component wrapper
    page-client.tsx    # Client component with UI logic
    loading.tsx        # Loading skeleton

components/
  [feature]/
    [component].tsx    # Reusable components
  ui/                  # Shadcn components
    
contexts/            # React contexts
lib/                 # Utilities, helpers
\`\`\`

This design system ensures a consistent, professional, and accessible user experience across the entire Effizienz Praxis application.
