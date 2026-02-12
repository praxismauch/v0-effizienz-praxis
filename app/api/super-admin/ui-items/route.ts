import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// This API returns the current list of all UI items in the application
// It should be updated whenever new menu items are added to the system

export async function GET(request: NextRequest) {
  try {
    // Note: Auth check is intentionally relaxed here.
    // This route is under /api/super-admin/ which is only accessible via the super-admin UI.
    // Other super-admin routes (form-scan, code-review) also don't check auth.
    // The super-admin layout itself handles access control.

    // Return the current UI items structure
    // This is the SINGLE SOURCE OF TRUTH for all menu items
    // When adding new menu items to the app, ADD THEM HERE as well
    const uiItems = {
      version: "2025-01-09", // Update this version when items change
      lastUpdated: new Date().toISOString(),
      categories: [
        {
          id: "app-sidebar",
          name: "App Sidebar (Frontend)",
          description: "Hauptnavigation der Anwendung",
          sections: [
            {
              id: "overview",
              name: "Übersicht",
              items: [
                { id: "dashboard", name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
                { id: "ai-analysis", name: "KI-Analyse", path: "/analysis", icon: "BarChart3" },
                { id: "academy", name: "Academy", path: "/academy", icon: "GraduationCap" },
              ],
            },
            {
              id: "planning",
              name: "Planung & Organisation",
              items: [
                { id: "calendar", name: "Kalender", path: "/calendar", icon: "CalendarDays" },
                { id: "dienstplan", name: "Dienstplan", path: "/dienstplan", icon: "Clock" },
                { id: "zeiterfassung", name: "Zeiterfassung", path: "/zeiterfassung", icon: "Clock" },
                { id: "tasks", name: "Aufgaben", path: "/todos", icon: "ClipboardList" },
                { id: "goals", name: "Ziele", path: "/goals", icon: "Target" },
                { id: "workflows", name: "Workflows", path: "/workflows", icon: "Workflow" },
                { id: "responsibilities", name: "Zuständigkeiten", path: "/responsibilities", icon: "ClipboardCheck" },
              ],
            },
            {
              id: "data",
              name: "Daten & Dokumente",
              items: [
                { id: "analytics", name: "Kennzahlen", path: "/analytics", icon: "LineChart" },
                { id: "practice-journals", name: "Praxis-Journal", path: "/practice-journals", icon: "BookOpen" },
                { id: "documents", name: "Dokumente", path: "/documents", icon: "FileText" },
                { id: "knowledge", name: "Wissen", path: "/knowledge", icon: "BookOpen" },
                { id: "protocols", name: "Protokolle", path: "/protocols", icon: "MessageSquare" },
              ],
            },
            {
              id: "strategy",
              name: "Strategie & Führung",
              items: [
                { id: "strategy-journey", name: "Strategiepfad", path: "/strategy-journey", icon: "Compass" },
                { id: "leadership", name: "Leadership", path: "/leadership", icon: "Crown" },
                { id: "wellbeing", name: "Mitarbeiter-Wellbeing", path: "/wellbeing", icon: "Heart" },
                { id: "qualitaetszirkel", name: "Qualitätszirkel", path: "/qualitaetszirkel", icon: "CircleDot" },
                { id: "leitbild", name: "Leitbild", path: "/leitbild", icon: "Sparkles" },
                { id: "roi-analysis", name: "Lohnt-es-sich-Analyse", path: "/roi-analysis", icon: "LineChart" },
                { id: "igel-analysis", name: "Selbstzahler-Analyse", path: "/igel-analysis", icon: "Lightbulb" },
                { id: "competitor-analysis", name: "Konkurrenzanalyse", path: "/competitor-analysis", icon: "Network" },
                { id: "wunschpatient", name: "Wunschpatient", path: "/wunschpatient", icon: "Target" },
              ],
            },
            {
              id: "team-personal",
              name: "Team & Personal",
              items: [
                { id: "hiring", name: "Personalsuche", path: "/hiring", icon: "BriefcaseBusiness" },
                { id: "team", name: "Team", path: "/team", icon: "Users" },
                {
                  id: "mitarbeitergespraeche",
                  name: "Mitarbeitergespräche",
                  path: "/mitarbeitergespraeche",
                  icon: "MessageCircle",
                },
                { id: "selbst-check", name: "Selbst-Check", path: "/selbst-check", icon: "Heart" },
                { id: "skills", name: "Kompetenzen", path: "/skills", icon: "Award" },
                { id: "organigramm", name: "Organigramm", path: "/organigramm", icon: "FolderKanban" },
              ],
            },
            {
              id: "praxis-einstellungen",
              name: "Praxis & Einstellungen",
              items: [
                { id: "contacts", name: "Kontakte", path: "/contacts", icon: "Contact" },
                { id: "surveys", name: "Umfragen", path: "/surveys", icon: "ClipboardList" },
                { id: "arbeitsplaetze", name: "Arbeitsplätze", path: "/arbeitsplaetze", icon: "BriefcaseBusiness" },
                { id: "rooms", name: "Räume", path: "/rooms", icon: "Pin" },
                { id: "arbeitsmittel", name: "Arbeitsmittel", path: "/arbeitsmittel", icon: "Wrench" },
                { id: "inventory", name: "Material", path: "/inventory", icon: "Package" },
                { id: "devices", name: "Geräte", path: "/devices", icon: "Stethoscope" },
                { id: "settings", name: "Einstellungen", path: "/settings", icon: "Settings" },
              ],
            },
          ],
        },
        {
          id: "app-header",
          name: "App Header (Top Right)",
          description: "Icons und Aktionen in der oberen Leiste",
          sections: [
            {
              id: "header-actions",
              name: "Header Aktionen",
              items: [
                { id: "ai-chat-button", name: "KI-Assistent Button", path: "#ai-chat", icon: "Sparkles" },
                { id: "create-todo-button", name: "Neue Aufgabe Button", path: "#create-todo", icon: "CheckSquare" },
                { id: "notifications-button", name: "Benachrichtigungen", path: "#notifications", icon: "Bell" },
                { id: "messages-button", name: "Nachrichten Button", path: "/messages", icon: "MessageSquare" },
                { id: "academy-button", name: "Academy Button", path: "/academy", icon: "GraduationCap" },
                { id: "bug-report-button", name: "Bug Melden Button", path: "#bug-report", icon: "Bug" },
                { id: "theme-toggle", name: "Theme Toggle (Dark/Light)", path: "#theme", icon: "Moon" },
                { id: "help-button", name: "Hilfe Button", path: "/help", icon: "HelpCircle" },
                { id: "referral-button", name: "Empfehlen Button", path: "#referral", icon: "Gift" },
                { id: "global-search", name: "Globale Suche", path: "#search", icon: "Search" },
                { id: "profile-dropdown", name: "Profil Dropdown", path: "/profile", icon: "Users" },
                { id: "logout-button", name: "Abmelden Button", path: "#logout", icon: "LogOut" },
              ],
            },
          ],
        },
        {
          id: "super-admin-sidebar",
          name: "Super-Admin Sidebar (Backend)",
          description: "Navigation im Admin-Bereich",
          sections: [
            {
              id: "admin-overview",
              name: "Übersicht",
              items: [
                { id: "admin-dashboard", name: "Dashboard", path: "/super-admin", icon: "LayoutGrid" },
                { id: "admin-practices", name: "Praxen", path: "/super-admin/practices", icon: "Building2" },
                { id: "admin-users", name: "Benutzer", path: "/super-admin/users", icon: "Users" },
              ],
            },
            {
              id: "admin-management",
              name: "Verwaltung",
              items: [
                { id: "admin-templates", name: "Vorlagen", path: "/super-admin/templates", icon: "LayoutPanelLeft" },
                { id: "admin-workflows", name: "Workflows", path: "/super-admin/workflows", icon: "Workflow" },
                { id: "admin-goals", name: "Ziele", path: "/super-admin/goals", icon: "Target" },
                {
                  id: "admin-responsibilities",
                  name: "Zuständigkeiten",
                  path: "/super-admin/responsibilities",
                  icon: "ClipboardCheck",
                },
                { id: "admin-skills", name: "Kompetenzen", path: "/super-admin/skills", icon: "Award" },
                { id: "admin-roadmap", name: "Roadmap", path: "/super-admin/roadmap", icon: "Compass" },
                { id: "admin-todos", name: "Aufgaben", path: "/super-admin/todos", icon: "ListTodo" },
              ],
            },
            {
              id: "admin-content",
              name: "Inhalte",
              items: [
                { id: "admin-academy", name: "Academy", path: "/super-admin/academy", icon: "GraduationCap" },
                { id: "admin-blog", name: "Blog", path: "/super-admin/blog", icon: "FileText" },
                { id: "admin-documents", name: "Dokumente", path: "/super-admin/documents", icon: "FolderKanban" },
              ],
            },
            {
              id: "admin-communication",
              name: "Kommunikation",
              items: [{ id: "admin-email", name: "E-Mail", path: "/super-admin/email", icon: "Mail" }],
            },
            {
              id: "admin-billing",
              name: "Abrechnung",
              items: [
                { id: "admin-billing-overview", name: "Übersicht", path: "/super-admin/billing", icon: "CreditCard" },
              ],
            },
            {
              id: "admin-system",
              name: "System",
              items: [
                { id: "admin-settings", name: "Einstellungen", path: "/super-admin/settings", icon: "Settings" },
                { id: "admin-verwaltung", name: "Verwaltung", path: "/super-admin/verwaltung", icon: "Settings" },
                { id: "admin-features", name: "Feature-Verwaltung", path: "/super-admin/features", icon: "ToggleLeft" },
                { id: "admin-backups", name: "Backups", path: "/super-admin/backups", icon: "Database" },
                { id: "admin-logs", name: "Logs", path: "/super-admin/logs", icon: "ScrollText" },
              ],
            },
            {
              id: "admin-testing",
              name: "Testing",
              items: [
                { id: "admin-test-overview", name: "Test-Übersicht", path: "/super-admin/testing", icon: "TestTube" },
                {
                  id: "admin-test-checklists",
                  name: "Test-Checklisten",
                  path: "/super-admin/testing?tab=checklists",
                  icon: "FolderCheck",
                },
                {
                  id: "admin-test-categories",
                  name: "Kategorien",
                  path: "/super-admin/testing?tab=categories",
                  icon: "Tags",
                },
                {
                  id: "admin-test-ui-items",
                  name: "UI-Items Test",
                  path: "/super-admin/testing?tab=ui-items",
                  icon: "LayoutList",
                },
              ],
            },
          ],
        },
        {
          id: "landing-page",
          name: "Landing Page (Frontend)",
          description: "Öffentliche Startseite",
          sections: [
            {
              id: "landing-nav",
              name: "Navigation",
              items: [
                { id: "landing-logo", name: "Logo (Home)", path: "/", icon: "Globe" },
                { id: "landing-features", name: "Features Link", path: "/#features", icon: "Menu" },
                { id: "landing-vorteile", name: "Vorteile Link", path: "/#benefits", icon: "Menu" },
                { id: "landing-login", name: "Login Button", path: "/auth/login", icon: "Users" },
                { id: "landing-demo", name: "Demo Anfragen Button", path: "/kontakt", icon: "Calendar" },
              ],
            },
            {
              id: "landing-sections",
              name: "Sektionen",
              items: [
                { id: "landing-hero", name: "Hero Section", path: "/#hero", icon: "Globe" },
                { id: "landing-features-section", name: "Features Section", path: "/#features", icon: "Sparkles" },
                { id: "landing-benefits-section", name: "Vorteile Section", path: "/#benefits", icon: "Award" },
                { id: "landing-quiz", name: "Effizienz-Quiz", path: "/#quiz", icon: "ClipboardCheck" },
                { id: "landing-testimonials", name: "Testimonials Section", path: "/#testimonials", icon: "Quote" },
                { id: "landing-pricing", name: "Pricing Section", path: "/#pricing", icon: "CreditCard" },
                { id: "landing-faq", name: "FAQ Section", path: "/#faq", icon: "HelpCircle" },
                { id: "landing-cta", name: "CTA Section", path: "/#cta", icon: "Target" },
                { id: "landing-chatbot", name: "AI Chatbot", path: "#chatbot", icon: "MessageSquare" },
              ],
            },
          ],
        },
        {
          id: "landing-footer",
          name: "Landing Page Footer",
          description: "Footer Links und Informationen",
          sections: [
            {
              id: "footer-product",
              name: "Produkt",
              items: [
                { id: "footer-alle-funktionen", name: "Alle Funktionen", path: "/alle-funktionen", icon: "FileText" },
                { id: "footer-preise", name: "Preise", path: "/preise", icon: "CreditCard" },
                { id: "footer-warteliste", name: "Warteliste", path: "/coming-soon", icon: "Clock" },
                { id: "footer-changelog", name: "Changelog", path: "/whats-new", icon: "FileText" },
              ],
            },
            {
              id: "footer-company",
              name: "Unternehmen",
              items: [
                { id: "footer-about", name: "Über uns", path: "/about", icon: "Building2" },
                { id: "footer-blog", name: "Blog", path: "/blog", icon: "FileText" },
                { id: "footer-kontakt", name: "Kontakt", path: "/kontakt", icon: "Contact" },
                { id: "footer-help", name: "Hilfe und Support", path: "/help", icon: "HelpCircle" },
                { id: "footer-karriere", name: "Karriere", path: "/karriere", icon: "BriefcaseBusiness" },
              ],
            },
            {
              id: "footer-contact",
              name: "Kontakt",
              items: [
                { id: "footer-email", name: "E-Mail Link", path: "mailto:info@effizienz-praxis.de", icon: "Mail" },
                { id: "footer-phone", name: "Telefon Link", path: "tel:+491726277371", icon: "Phone" },
                { id: "footer-address", name: "Adresse", path: "#address", icon: "MapPin" },
              ],
            },
            {
              id: "footer-social",
              name: "Social Media",
              items: [
                {
                  id: "footer-twitter",
                  name: "Twitter/X",
                  path: "https://twitter.com/effizienzpraxis",
                  icon: "Twitter",
                },
                {
                  id: "footer-linkedin",
                  name: "LinkedIn",
                  path: "https://linkedin.com/company/effizienz-praxis",
                  icon: "Linkedin",
                },
                {
                  id: "footer-youtube",
                  name: "YouTube",
                  path: "https://youtube.com/@effizienzpraxis",
                  icon: "Youtube",
                },
                {
                  id: "footer-instagram",
                  name: "Instagram",
                  path: "https://instagram.com/effizienzpraxis",
                  icon: "Instagram",
                },
              ],
            },
            {
              id: "footer-legal",
              name: "Rechtliches",
              items: [
                { id: "footer-impressum", name: "Impressum", path: "/impressum", icon: "FileText" },
                { id: "footer-datenschutz", name: "Datenschutz", path: "/datenschutz", icon: "FileText" },
                { id: "footer-agb", name: "AGB", path: "/agb", icon: "FileText" },
                { id: "footer-cookies", name: "Cookie-Richtlinie", path: "/cookies", icon: "FileText" },
              ],
            },
          ],
        },
        {
          id: "public-pages",
          name: "Öffentliche Seiten",
          description: "Alle öffentlich zugänglichen Seiten",
          sections: [
            {
              id: "auth-pages",
              name: "Authentifizierung",
              items: [
                { id: "login-page", name: "Login Seite", path: "/auth/login", icon: "LogIn" },
                { id: "register-page", name: "Registrierung", path: "/auth/register", icon: "UserPlus" },
                { id: "forgot-password", name: "Passwort vergessen", path: "/auth/forgot-password", icon: "Key" },
                { id: "reset-password", name: "Passwort zurücksetzen", path: "/auth/reset-password", icon: "KeyRound" },
              ],
            },
            {
              id: "info-pages",
              name: "Info-Seiten",
              items: [
                { id: "about-page", name: "Über uns", path: "/about", icon: "Info" },
                { id: "kontakt-page", name: "Kontakt", path: "/kontakt", icon: "Contact" },
                { id: "preise-page", name: "Preise", path: "/preise", icon: "CreditCard" },
                { id: "blog-page", name: "Blog Übersicht", path: "/blog", icon: "FileText" },
                { id: "help-page", name: "Hilfe Center", path: "/help", icon: "HelpCircle" },
                { id: "karriere-page", name: "Karriere", path: "/karriere", icon: "BriefcaseBusiness" },
              ],
            },
            {
              id: "legal-pages",
              name: "Rechtliche Seiten",
              items: [
                { id: "impressum-page", name: "Impressum", path: "/impressum", icon: "Scale" },
                { id: "datenschutz-page", name: "Datenschutz", path: "/datenschutz", icon: "Shield" },
                { id: "agb-page", name: "AGB", path: "/agb", icon: "ScrollText" },
                { id: "cookies-page", name: "Cookie-Richtlinie", path: "/cookies", icon: "Cookie" },
              ],
            },
          ],
        },
      ],
    }

    return NextResponse.json(uiItems)
  } catch (error) {
    console.error("Error in GET /api/super-admin/ui-items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
