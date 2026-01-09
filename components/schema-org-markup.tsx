"use client"

export function SchemaOrgMarkup() {
  // Software Application Schema - Main product
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Effizienz Praxis",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Praxismanagement Software",
    operatingSystem: "Web-based",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "49",
        priceCurrency: "EUR",
        priceValidUntil: "2026-12-31",
        description: "Für kleine Praxen bis 5 Mitarbeiter",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          maxValue: 5,
          unitText: "Mitarbeiter",
        },
      },
      {
        "@type": "Offer",
        name: "Professional",
        price: "99",
        priceCurrency: "EUR",
        priceValidUntil: "2026-12-31",
        description: "Für mittelgroße Praxen bis 15 Mitarbeiter",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          maxValue: 15,
          unitText: "Mitarbeiter",
        },
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "199",
        priceCurrency: "EUR",
        priceValidUntil: "2026-12-31",
        description: "Für große Praxen und MVZ",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "KI-gestützte Mitarbeiterentwicklung",
      "Team-Management",
      "Zielvereinbarungen",
      "Aufgabenverwaltung",
      "Recruiting-Tools",
      "Organigramm-Erstellung",
      "Analytics & Reporting",
      "DSGVO-konform",
    ],
    screenshot: "https://effizienz-praxis.de/dashboard-preview.png",
    softwareHelp: {
      "@type": "CreativeWork",
      url: "https://effizienz-praxis.de/hilfe",
    },
    author: {
      "@type": "Organization",
      name: "Effizienz Praxis GmbH",
    },
  }

  // Organization Schema - Company info
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Effizienz Praxis",
    legalName: "Effizienz Praxis GmbH",
    url: "https://effizienz-praxis.de",
    logo: "https://effizienz-praxis.de/logo.png",
    description:
      "Moderne Praxismanagement Software für Arztpraxen, Zahnarztpraxen und MVZ. KI-gestützte Mitarbeiterentwicklung und Team-Management.",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Germany",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@effizienz-praxis.de",
      availableLanguage: ["German", "English"],
    },
    sameAs: ["https://www.linkedin.com/company/effizienz-praxis", "https://twitter.com/effizienzpraxis"],
    knowsAbout: [
      "Praxismanagement",
      "Arztpraxis Software",
      "Zahnarztpraxis Management",
      "MVZ Verwaltung",
      "Mitarbeiterentwicklung im Gesundheitswesen",
      "Healthcare Management",
      "Team-Führung in Arztpraxen",
    ],
  }

  // Medical Business / Healthcare Provider Software Context
  const medicalSoftwareSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Effizienz Praxis - Praxismanagement Software",
    description:
      "Digitale Praxismanagement-Lösung speziell entwickelt für Arztpraxen, Zahnarztpraxen, MVZ und medizinische Versorgungszentren. Unterstützt bei Mitarbeiterführung, Zielvereinbarungen und Teamorganisation.",
    brand: {
      "@type": "Brand",
      name: "Effizienz Praxis",
    },
    category: "Praxismanagement Software / Healthcare Management Software",
    audience: {
      "@type": "Audience",
      audienceType: "Medizinische Fachkräfte",
      geographicArea: {
        "@type": "Country",
        name: "Deutschland",
      },
    },
    isRelatedTo: [
      {
        "@type": "MedicalSpecialty",
        name: "Allgemeinmedizin",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Zahnmedizin",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Orthopädie",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Dermatologie",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Gynäkologie",
      },
    ],
  }

  // FAQ Schema - Common questions about the software
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Was ist Effizienz Praxis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Effizienz Praxis ist eine moderne Praxismanagement-Software speziell für Arztpraxen, Zahnarztpraxen und MVZ. Sie bietet KI-gestützte Mitarbeiterentwicklung, Team-Management, Zielvereinbarungen und umfassende Analytics.",
        },
      },
      {
        "@type": "Question",
        name: "Ist Effizienz Praxis DSGVO-konform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja, Effizienz Praxis ist vollständig DSGVO-konform. Alle Daten werden auf deutschen Servern gehostet und mit Ende-zu-Ende-Verschlüsselung geschützt. Wir stellen auf Anfrage einen Auftragsverarbeitungsvertrag (AV-Vertrag) bereit.",
        },
      },
      {
        "@type": "Question",
        name: "Welche Praxisarten werden unterstützt?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Effizienz Praxis ist für alle medizinischen Einrichtungen geeignet: Arztpraxen aller Fachrichtungen, Zahnarztpraxen, Physiotherapie-Praxen, MVZ (Medizinische Versorgungszentren), Kliniken und Gemeinschaftspraxen.",
        },
      },
      {
        "@type": "Question",
        name: "Wie funktioniert die KI-gestützte Mitarbeiterentwicklung?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Unsere KI analysiert Leistungsdaten, Feedback und Entwicklungspotenziale Ihrer Mitarbeiter. Sie erhalten automatische Empfehlungen für Weiterbildungen, Zielvereinbarungen und Karrierepfade - alles datenschutzkonform und transparent.",
        },
      },
      {
        "@type": "Question",
        name: "Was kostet Effizienz Praxis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Effizienz Praxis bietet drei Tarife: Starter für 49€/Monat (bis 5 Mitarbeiter), Professional für 99€/Monat (bis 15 Mitarbeiter) und Enterprise für 199€/Monat (für große Praxen und MVZ). Alle Tarife beinhalten den vollen Funktionsumfang.",
        },
      },
      {
        "@type": "Question",
        name: "Gibt es eine kostenlose Testphase?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja, Sie können Effizienz Praxis 14 Tage lang kostenlos und unverbindlich testen. Keine Kreditkarte erforderlich. Nach der Testphase entscheiden Sie, ob Sie fortfahren möchten.",
        },
      },
    ],
  }

  // WebSite Schema - For sitelinks search box
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Effizienz Praxis",
    url: "https://effizienz-praxis.de",
    description: "Moderne Praxismanagement Software für Arztpraxen und MVZ",
    inLanguage: "de-DE",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://effizienz-praxis.de/suche?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }

  // Service Schema - Main services offered
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Praxismanagement Software",
    provider: {
      "@type": "Organization",
      name: "Effizienz Praxis",
    },
    areaServed: {
      "@type": "Country",
      name: "Germany",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Effizienz Praxis Funktionen",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "KI-gestützte Mitarbeiterentwicklung",
            description:
              "Automatische Analyse und Empfehlungen für die individuelle Entwicklung Ihrer Praxismitarbeiter",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Team-Management",
            description: "Übersichtliche Verwaltung von Teams, Zuständigkeiten und Arbeitsabläufen",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Zielvereinbarungen",
            description: "Strukturierte Zieldefinition und Fortschrittsverfolgung für Mitarbeiter",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Recruiting",
            description: "Integrierte Tools für Stellenausschreibungen und Bewerbermanagement",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Analytics & Reporting",
            description: "Umfassende Auswertungen und Berichte zur Praxisperformance",
          },
        },
      ],
    },
  }

  // BreadcrumbList Schema for navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://effizienz-praxis.de",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: "https://effizienz-praxis.de/#features",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Preise",
        item: "https://effizienz-praxis.de/#preise",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Kontakt",
        item: "https://effizienz-praxis.de/#kontakt",
      },
    ],
  }

  return (
    <>
      {/* Software Application Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Medical Software/Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(medicalSoftwareSchema),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      {/* Services Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(servicesSchema),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  )
}
