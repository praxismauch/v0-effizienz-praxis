"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react"

export function LandingPageFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Effizienz Praxis</h3>
            <p className="text-sm text-muted-foreground">
              KI-gestützte Praxismanagement Software für medizinische Einrichtungen. Optimieren Sie Ihre Praxisabläufe
              und steigern Sie die Effizienz.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://instagram.com/effizienzpraxis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com/effizienzpraxis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Produkt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/alle-funktionen" className="text-muted-foreground hover:text-primary transition-colors">
                  Alle Funktionen
                </Link>
              </li>
              <li>
                <Link href="/preise" className="text-muted-foreground hover:text-primary transition-colors">
                  Preise
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors">
                  Warteliste
                </Link>
              </li>
              <li>
                <Link href="/whats-new" className="text-muted-foreground hover:text-primary transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Unternehmen</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  Hilfe und Support
                </Link>
              </li>
              <li>
                <Link href="/karriere" className="text-muted-foreground hover:text-primary transition-colors">
                  Karriere
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <a
                  href="mailto:info@effizienz-praxis.de"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@effizienz-praxis.de
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <a href="tel:+491726277371" className="text-muted-foreground hover:text-primary transition-colors">
                  +49 (0) 172 62 77 371
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Allgäuerstraße 106
                  <br />
                  87600 Kaufbeuren
                  <br />
                  Deutschland
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {currentYear} Effizienz Praxis. Alle Rechte vorbehalten.</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/impressum" className="text-muted-foreground hover:text-primary transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">
                Datenschutz
              </Link>
              <Link href="/agb" className="text-muted-foreground hover:text-primary transition-colors">
                AGB
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                Cookie-Richtlinie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingPageFooter
