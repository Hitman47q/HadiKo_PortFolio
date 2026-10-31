import { checkPassword, clearSessionCookie, createSessionCookie, isAuthed } from '../../server/auth.js'
import { notifyChannels, notifyNewMessage } from '../../server/notify.js'

const PROJECT_TYPES = ['web_app', 'video_production_reel', 'mobile_flutter']
const PUBLIC_SETTINGS = ['available', 'cv_url']
const BOT_UA = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|whatsapp/i

const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
const fail = (error, status = 400) => json({ error }, status)

const clientIp = request => request.headers.get('cf-connecting-ip') || 'local'
const str = (v, max = 5000) => String(v ?? '').trim().slice(0, max)
const isUrlish = v => !v || v.startsWith('/') || /^https?:\/\//i.test(v)

async function readJson(request) {
  try { return await request.json() } catch { return {} }
}

// Browsers always send Origin on cross-site POST/PUT/DELETE; reject anything not from this site.
function sameOrigin(request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

function projectFromBody(b) {
  const p = {
    name: str(b.name, 160),
    type: str(b.type, 40),
    photo: str(b.photo, 1000),
    description: str(b.description, 600),
    link: str(b.link, 1000),
    details: str(b.details, 8000),
    tech: str(b.tech, 500),
    video_url: str(b.video_url, 1000),
    featured: b.featured ? 1 : 0,
  }
  if (!p.name || !p.description || !p.link) return { error: 'Name, description and link are required' }
  if (!PROJECT_TYPES.includes(p.type)) return { error: 'Unknown project type' }
  if (![p.photo, p.link, p.video_url].every(isUrlish)) return { error: 'Links must start with http(s):// or /' }
  return { p }
}

/* ---------- public ---------- */

async function getPublic(env) {
  const [projects, testimonials, settings] = await env.DB.batch([
    env.DB.prepare(`SELECT id, name, type, photo, description, link, details, tech, video_url, featured
                    FROM projects ORDER BY featured DESC, sort_order ASC, created_at DESC`),
    env.DB.prepare('SELECT id, name, role, quote FROM testimonials ORDER BY sort_order ASC, id ASC'),
    env.DB.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_SETTINGS.map(() => '?').join(',')})`)
      .bind(...PUBLIC_SETTINGS),
  ])
  return json({
    projects: projects.results,
    testimonials: testimonials.results,
    settings: Object.fromEntries(settings.results.map(r => [r.key, r.value])),
  }, 200, { 'Cache-Control': 'public, max-age=60' })
}

async function track(request, env) {
  const ua = request.headers.get('user-agent') || ''
  if (BOT_UA.test(ua)) return json({ status: 'skipped' })
  const b = await readJson(request)
  await env.DB.prepare(
    `INSERT INTO visitors (ip, url, user_agent, referrer, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
  ).bind(clientIp(request), str(b.url, 500) || '/', ua.slice(0, 500), str(b.referrer, 500)).run()
  return json({ status: 'tracked' })
}

async function sendMessage(request, env, waitUntil) {
  const b = await readJson(request)
  if (b.website) return json({ status: 'sent' }) // honeypot: pretend success for bots
  const name = str(b.name, 120), email = str(b.email, 200), message = str(b.message, 5000)
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please fill in your name, a valid email and a message')
  const ip = clientIp(request)
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM messages WHERE ip = ? AND created_at > datetime('now', '-10 minutes')",
  ).bind(ip).first()
  if (recent.n >= 3) return fail('Too many messages, please try again in a few minutes', 429)
  await env.DB.prepare(
    "INSERT INTO messages (name, email, message, ip, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
  ).bind(name, email, message, ip).run()
  // Notify in the background so the visitor isn't kept waiting; the message is already saved.
  waitUntil(notifyNewMessage(env, { name, email, message }, new URL(request.url).origin))
  return json({ status: 'sent' }, 201)
}

async function testNotification(request, env) {
  const on = notifyChannels(env)
  if (!on.telegram && !on.email) {
    return fail('No notification channel is set up yet. Add the Telegram or email secrets in Cloudflare, then redeploy.')
  }
  const result = await notifyNewMessage(env, {
    name: 'Portfolio test',
    email: 'test@example.com',
    message: 'This is a test notification from /admin. If you can read this, notifications work!',
  }, new URL(request.url).origin)
  if (result.errors.length) return fail(result.errors.join('; '), 502)
  return json(result)
}

/* ---------- admin: auth ---------- */

async function login(request, env) {
  if (!env.ADMIN_PASSWORD) return fail('ADMIN_PASSWORD secret is not set on this deployment', 500)
  const ip = clientIp(request)
  const failures = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM login_failures WHERE ip = ? AND created_at > datetime('now', '-15 minutes')",
  ).bind(ip).first()
  if (failures.n >= 5) return fail('Too many attempts, try again in 15 minutes', 429)

  const { password } = await readJson(request)
  if (!(await checkPassword(env, password))) {
    await env.DB.prepare("INSERT INTO login_failures (ip, created_at) VALUES (?, datetime('now'))").bind(ip).run()
    return fail('Wrong password', 401)
  }
  await env.DB.prepare("DELETE FROM login_failures WHERE ip = ? OR created_at < datetime('now', '-1 day')").bind(ip).run()
  return json({ status: 'ok' }, 200, { 'Set-Cookie': await createSessionCookie(env) })
}

/* ---------- admin: data ---------- */

async function stats(env) {
  const q = sql => env.DB.prepare(sql)
  const [counts, daily, refs, recent] = await env.DB.batch([
    q(`SELECT
         (SELECT COUNT(*) FROM projects) AS projects,
         (SELECT COUNT(*) FROM messages WHERE is_read = 0) AS unread,
         (SELECT COUNT(*) FROM visitors) AS visitors_total,
         (SELECT COUNT(*) FROM visitors WHERE created_at > datetime('now', '-1 day')) AS visitors_day,
         (SELECT COUNT(*) FROM visitors WHERE created_at > datetime('now', '-7 days')) AS visitors_week,
         (SELECT COUNT(*) FROM visitors WHERE created_at > datetime('now', '-30 days')) AS visitors_month`),
    q(`SELECT date(created_at) AS day, COUNT(*) AS n FROM visitors
       WHERE created_at > datetime('now', '-30 days') GROUP BY day ORDER BY day`),
    q(`SELECT referrer FROM visitors WHERE referrer != '' AND created_at > datetime('now', '-30 days')`),
    q('SELECT url, referrer, user_agent, created_at FROM visitors ORDER BY id DESC LIMIT 15'),
  ])
  const hosts = {}
  for (const { referrer } of refs.results) {
    let host
    try { host = new URL(referrer).hostname.replace(/^www\./, '') } catch { continue }
    hosts[host] = (hosts[host] || 0) + 1
  }
  const referrers = Object.entries(hosts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([host, n]) => ({ host, n }))
  return json({ ...counts.results[0], daily: daily.results, referrers, recent: recent.results })
}

async function projectsRoute(request, env, id) {
  const { method } = request
  if (method === 'GET' && !id) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM projects ORDER BY featured DESC, sort_order ASC, created_at DESC',
    ).all()
    return json(results)
  }
  if (method === 'POST' && id === 'reorder') {
    const { ids } = await readJson(request)
    if (!Array.isArray(ids)) return fail('ids must be an array')
    await env.DB.batch(ids.map((pid, i) =>
      env.DB.prepare('UPDATE projects SET sort_order = ? WHERE id = ?').bind(i, Number(pid))))
    return json({ status: 'reordered' })
  }
  if (method === 'POST' && !id) {
    const { p, error } = projectFromBody(await readJson(request))
    if (error) return fail(error)
    const max = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM projects').first()
    const row = await env.DB.prepare(
      `INSERT INTO projects (name, type, photo, description, link, details, tech, video_url, featured, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')) RETURNING *`,
    ).bind(p.name, p.type, p.photo, p.description, p.link, p.details, p.tech, p.video_url, p.featured, max.m + 1).first()
    return json(row, 201)
  }
  if (method === 'PUT' && id) {
    const { p, error } = projectFromBody(await readJson(request))
    if (error) return fail(error)
    const row = await env.DB.prepare(
      `UPDATE projects SET name = ?, type = ?, photo = ?, description = ?, link = ?, details = ?, tech = ?,
         video_url = ?, featured = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`,
    ).bind(p.name, p.type, p.photo, p.description, p.link, p.details, p.tech, p.video_url, p.featured, Number(id)).first()
    return row ? json(row) : fail('Not found', 404)
  }
  if (method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(Number(id)).run()
    return json({ status: 'deleted' })
  }
  return fail('Not found', 404)
}

async function testimonialsRoute(request, env, id) {
  const { method } = request
  if (method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC').all()
    return json(results)
  }
  if (method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM testimonials WHERE id = ?').bind(Number(id)).run()
    return json({ status: 'deleted' })
  }
  const b = await readJson(request)
  const t = { name: str(b.name, 120), role: str(b.role, 160), quote: str(b.quote, 1500), sort_order: Number(b.sort_order) || 0 }
  if (!t.name || !t.quote) return fail('Name and quote are required')
  if (method === 'POST' && !id) {
    const row = await env.DB.prepare(
      'INSERT INTO testimonials (name, role, quote, sort_order) VALUES (?, ?, ?, ?) RETURNING *',
    ).bind(t.name, t.role, t.quote, t.sort_order).first()
    return json(row, 201)
  }
  if (method === 'PUT' && id) {
    const row = await env.DB.prepare(
      'UPDATE testimonials SET name = ?, role = ?, quote = ?, sort_order = ? WHERE id = ? RETURNING *',
    ).bind(t.name, t.role, t.quote, t.sort_order, Number(id)).first()
    return row ? json(row) : fail('Not found', 404)
  }
  return fail('Not found', 404)
}

async function messagesRoute(request, env, id) {
  const { method } = request
  if (method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all()
    return json(results)
  }
  if (method === 'PATCH' && id) {
    const { is_read } = await readJson(request)
    await env.DB.prepare('UPDATE messages SET is_read = ? WHERE id = ?').bind(is_read ? 1 : 0, Number(id)).run()
    return json({ status: 'updated' })
  }
  if (method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(Number(id)).run()
    return json({ status: 'deleted' })
  }
  return fail('Not found', 404)
}

async function settingsRoute(request, env) {
  if (request.method === 'PUT') {
    const b = await readJson(request)
    const entries = Object.entries(b).filter(([k]) => PUBLIC_SETTINGS.includes(k))
    if (entries.some(([k, v]) => k === 'cv_url' && !isUrlish(str(v)))) return fail('CV link must start with http(s):// or /')
    await env.DB.batch(entries.map(([k, v]) =>
      env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .bind(k, str(v, 1000))))
  }
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all()
  return json(Object.fromEntries(results.map(r => [r.key, r.value])))
}

const UPLOAD_TYPES = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif',
  'application/pdf': 'pdf',
}
// D1 stores at most 2 MB per value; /admin shrinks images before sending them.
const MAX_UPLOAD = 1.9 * 1024 * 1024

async function upload(request, env) {
  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') return fail('No file uploaded')
  const ext = UPLOAD_TYPES[file.type]
  if (!ext) return fail('Only images and PDFs can be uploaded')
  if (file.size > MAX_UPLOAD) return fail('File is larger than 1.9 MB')
  const row = await env.DB.prepare(
    'INSERT INTO media (content_type, data, size) VALUES (?, ?, ?) RETURNING id',
  ).bind(file.type, await file.arrayBuffer(), file.size).first()
  return json({ url: `/media/${row.id}.${ext}` }, 201)
}

/* ---------- router ---------- */

export async function onRequest({ request, env, params, waitUntil }) {
  const parts = params.path || []
  const [section, sub, id] = parts
  const { method } = request

  if (method !== 'GET' && method !== 'HEAD' && !sameOrigin(request)) return fail('Forbidden', 403)

  try {
    if (section === 'public' && method === 'GET') return await getPublic(env)
    if (section === 'track' && method === 'POST') return await track(request, env)
    if (section === 'messages' && method === 'POST' && !sub) return await sendMessage(request, env, waitUntil)

    if (section === 'admin') {
      if (sub === 'login' && method === 'POST') return await login(request, env)
      if (sub === 'logout' && method === 'POST') return json({ status: 'ok' }, 200, { 'Set-Cookie': clearSessionCookie() })
      if (!(await isAuthed(request, env))) return fail('Unauthorized', 401)

      if (sub === 'me') return json({ status: 'ok' })
      if (sub === 'stats') return await stats(env)
      if (sub === 'projects') return await projectsRoute(request, env, id)
      if (sub === 'testimonials') return await testimonialsRoute(request, env, id)
      if (sub === 'messages') return await messagesRoute(request, env, id)
      if (sub === 'settings') return await settingsRoute(request, env)
      if (sub === 'notify-status') return json(notifyChannels(env))
      if (sub === 'notify-test' && method === 'POST') return await testNotification(request, env)
      if (sub === 'upload' && method === 'POST') return await upload(request, env)
    }
    return fail('Not found', 404)
  } catch (e) {
    console.error(e)
    return fail('Server error', 500)
  }
}
