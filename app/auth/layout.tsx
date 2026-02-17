import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Effizienz Praxis",
    default: "Anmelden | Effizienz Praxis",
  },
  robots: { index: false, follow: true },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
