"use client"

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Top-left - Red */}
      <circle cx="80" cy="80" r="60" fill="#ef4444" fillOpacity="0.9" />

      {/* Top-right - Yellow */}
      <circle cx="120" cy="80" r="60" fill="#eab308" fillOpacity="0.9" />

      {/* Bottom-left - Green */}
      <circle cx="80" cy="120" r="60" fill="#10b981" fillOpacity="0.9" />

      {/* Bottom-right - Cyan */}
      <circle cx="120" cy="120" r="60" fill="#06b6d4" fillOpacity="0.9" />
    </svg>
  )
}

export default Logo
