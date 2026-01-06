import Image from "next/image"

export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return <Image src="/icon.svg" alt="Effizienz Praxis" width={24} height={24} className={className} />
}

export default Logo
