// This component injects the btoa polyfill as an inline script in the <head>
// It runs before any other JavaScript to ensure btoa is patched early

// This component is kept for backward compatibility but does nothing

export function BtoaPolyfill() {
  // Polyfill is now loaded via inline script in layout.tsx <head>
  // This component is deprecated but kept to avoid breaking imports
  return null
}

export default BtoaPolyfill
