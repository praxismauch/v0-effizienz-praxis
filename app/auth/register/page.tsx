import { redirect } from "next/navigation"

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Preserve query parameters when redirecting
  const params = new URLSearchParams()

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
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
