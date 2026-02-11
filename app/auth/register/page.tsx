import { redirect } from "next/navigation"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  // Preserve query parameters when redirecting
  const params = new URLSearchParams()

  if (resolvedParams) {
    Object.entries(resolvedParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params.set(key, value)
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      }
    })
  }

  const queryString = params.toString()
  const redirectUrl = queryString ? `/auth/sign-up?${queryString}` : "/auth/sign-up"

  redirect(redirectUrl)
}
