import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "admin_session"
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

/**
 * Signing key for session tokens, derived from ADMIN_PASSWORD so the app needs no
 * extra configuration. The key never leaves the server, so a session token cannot
 * be forged by a client the way the old static "authenticated" cookie value could.
 *
 * Side effect worth knowing: changing ADMIN_PASSWORD invalidates existing sessions.
 * That is the desirable behaviour for a password rotation anyway.
 */
function getSigningKey(): string | null {
  const password = process.env.ADMIN_PASSWORD
  return password ? `lofiweb-session:${password}` : null
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url")
}

/** Constant-time string compare that does not leak length via early return. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8")
  const bufB = Buffer.from(b, "utf8")
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so timing stays flat for wrong-length inputs.
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/** Creates a signed, expiring session token. */
export function createSessionToken(): string | null {
  const key = getSigningKey()
  if (!key) return null

  const expiresAt = Date.now() + SESSION_TTL_MS
  const nonce = randomBytes(16).toString("base64url")
  const payload = `${expiresAt}.${nonce}`
  return `${payload}.${sign(payload, key)}`
}

/** Verifies signature and expiry of a session token. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false

  const key = getSigningKey()
  if (!key) return false

  const parts = token.split(".")
  if (parts.length !== 3) return false

  const [expiresAt, nonce, signature] = parts
  const payload = `${expiresAt}.${nonce}`

  if (!safeEqual(signature, sign(payload, key))) return false

  const expiry = Number(expiresAt)
  return Number.isFinite(expiry) && Date.now() < expiry
}

/** Reads and verifies the admin session from the request cookies. */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_TTL_MS / 1000,
  path: "/",
}

/**
 * Fixed-window login throttle. Serverless instances each keep their own counter,
 * so this blunts credential stuffing rather than eliminating it — pair with an
 * edge/WAF rule if the admin surface ever becomes a real target.
 */
const MAX_ATTEMPTS = 8
const WINDOW_MS = 1000 * 60 * 10
const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(identifier: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = attempts.get(identifier)

  if (!entry || now > entry.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  entry.count += 1
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  return { allowed: true, retryAfter: 0 }
}

export function clearRateLimit(identifier: string) {
  attempts.delete(identifier)
}

/** Best-effort client identifier for throttling. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"
}
