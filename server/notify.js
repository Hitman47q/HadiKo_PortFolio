// Contact-form notifications. Each channel is switched on by setting its secrets in the Pages project:
//   Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID   (instant push on your phone)
//   Email:    RESEND_API_KEY + NOTIFY_EMAIL           (sent via resend.com to the email you signed up with)

const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Forgive common paste slips: spaces/newlines, quotes, a leading "bot", or the whole API URL.
function cleanToken(raw) {
  const s = String(raw || '').trim().replace(/^["']|["']$/g, '').trim()
  const match = s.match(/(\d{5,}:[\w-]{20,})/)
  return match ? match[1] : s.replace(/^bot/i, '')
}
const cleanChatId = raw => String(raw || '').trim().replace(/^["']|["']$/g, '').trim()

function telegramError(status, description = '') {
  if (status === 404 || (/not found/i.test(description) && !/chat/i.test(description))) {
    return 'Telegram: the bot token is wrong. TELEGRAM_BOT_TOKEN should look like 123456789:AAH… (copy it again from @BotFather).'
  }
  if (/chat not found/i.test(description)) {
    return 'Telegram: chat not found. Check TELEGRAM_CHAT_ID, and press Start in your bot first.'
  }
  if (/blocked/i.test(description)) return 'Telegram: you blocked the bot. Unblock it and press Start.'
  if (status === 401) return 'Telegram: the bot token was rejected. Copy it again from @BotFather.'
  return `Telegram: ${description || status}`
}

export function notifyChannels(env) {
  return {
    telegram: !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
    email: !!(env.RESEND_API_KEY && env.NOTIFY_EMAIL),
  }
}

async function telegram(env, msg, adminUrl) {
  const text = [
    `📩 <b>New message from ${escapeHtml(msg.name)}</b>`,
    escapeHtml(msg.email),
    '',
    escapeHtml(msg.message.slice(0, 3500)),
    '',
    `<a href="${adminUrl}">Open in /admin</a>`,
  ].join('\n')
  const res = await fetch(`https://api.telegram.org/bot${cleanToken(env.TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: cleanChatId(env.TELEGRAM_CHAT_ID), text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!res.ok) throw new Error(telegramError(res.status, (await res.json().catch(() => ({}))).description))
}

async function email(env, msg, adminUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // resend.dev works without owning a domain, but only delivers to your own Resend account email.
      from: env.NOTIFY_FROM || 'Portfolio <onboarding@resend.dev>',
      to: [env.NOTIFY_EMAIL],
      reply_to: msg.email,
      subject: `New message from ${msg.name}`,
      text: `${msg.name} <${msg.email}>\n\n${msg.message}\n\nOpen in /admin: ${adminUrl}`,
    }),
  })
  if (!res.ok) throw new Error(`Email: ${(await res.json().catch(() => ({}))).message || res.status}`)
}

// Sends on every configured channel; returns { sent: [...], errors: [...] }.
export async function notifyNewMessage(env, msg, origin) {
  const adminUrl = `${origin}/admin#messages`
  const on = notifyChannels(env)
  const jobs = []
  if (on.telegram) jobs.push(['telegram', telegram(env, msg, adminUrl)])
  if (on.email) jobs.push(['email', email(env, msg, adminUrl)])
  const results = await Promise.allSettled(jobs.map(([, p]) => p))
  const sent = [], errors = []
  results.forEach((r, i) => (r.status === 'fulfilled' ? sent.push(jobs[i][0]) : errors.push(r.reason.message)))
  if (errors.length) console.error('Notification failed:', errors.join('; '))
  return { sent, errors }
}
