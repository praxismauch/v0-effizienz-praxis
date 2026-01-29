import proxy from "@/proxy"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await proxy(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
