"use client"

import Image from "next/image"

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src="/logo.png" alt="Effizienz Praxis Logo" width={200} height={200} className={className} priority />
}

export default Logo
