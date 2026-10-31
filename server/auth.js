const COOKIE = 'admin_session'
const SESSION_DAYS = 7
const encoder = new TextEncoder()

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(env, data) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return b64url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

// Hash both sides first so the comparison is constant-time and length-independent.
async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(ha, hb)
    : b64url(ha) === b64url(hb)
}

export function checkPassword(env, password) {
  if (!env.ADMIN_PASSWORD) return false
  return safeEqual(String(password || ''), env.ADMIN_PASSWORD)
}

export async function createSessionCookie(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5
  const value = `${exp}.${await hmac(env, String(exp))}`
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (!match) return false
  const [exp, sig] = match[1].split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  return safeEqual(sig, await hmac(env, exp))
}
