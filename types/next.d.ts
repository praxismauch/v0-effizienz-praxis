// Type declarations for Next.js 16 async APIs
// This ensures TypeScript recognizes cookies(), headers(), etc. as async functions

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

declare module "next/headers" {
  // Next.js 16: cookies() is now async and must be awaited
  export function cookies(): Promise<ReadonlyRequestCookies>

  // Next.js 16: headers() is now async and must be awaited
  export function headers(): Promise<Headers>

  // draftMode() is also async in Next.js 16
  export function draftMode(): Promise<{ isEnabled: boolean }>
}
