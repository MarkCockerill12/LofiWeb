import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  clearRateLimit,
  clientKey,
  createSessionToken,
  isAuthenticated,
  rateLimit,
  safeEqual,
} from "@/lib/auth"

export async function POST(request: Request) {
  const key = clientKey(request)
  const { allowed, retryAfter } = rateLimit(key)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    )
  }

  try {
    const { password } = await request.json()
    const expectedPassword = process.env.ADMIN_PASSWORD

    if (!expectedPassword) {
      return NextResponse.json(
        { error: "Administration password is not configured on the server environment" },
        { status: 500 },
      )
    }

    if (typeof password !== "string" || !safeEqual(password, expectedPassword)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    const token = createSessionToken()
    if (!token) {
      return NextResponse.json({ error: "Session signing is unavailable" }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    clearRateLimit(key)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ authenticated: await isAuthenticated() })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ success: true })
}
