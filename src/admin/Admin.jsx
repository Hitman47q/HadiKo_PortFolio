import { useCallback, useEffect, useState } from 'react'
import { typeLabels } from '../i18n.js'
import { api, mediaUrl } from '../lib/api.js'
import './admin.css'

const TABS = [
  ['overview', 'Overview'],
  ['projects', 'Projects'],
  ['testimonials', 'Testimonials'],
  ['messages', 'Messages'],
  ['settings', 'Settings'],
]
const EMPTY_PROJECT = { name: '', type: 'web_app', photo: '', description: '', link: '', details: '', tech: '', video_url: '', featured: false }
const EMPTY_QUOTE = { name: '', role: '', quote: '', sort_order: 0 }

const fmtDate = s => new Date(s.replace(' ', 'T') + 'Z').toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((text, kind = 'ok') => {
    setToast({ text, kind })
    setTimeout(() => setToast(null), 3200)
  }, [])
  const node = toast && <div className={`a-toast ${toast.kind}`} role="status">{toast.text}</div>
  return [show, node]
}

/* ---------- login ---------- */

function Login({ onDone }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/admin/login', { method: 'POST', body: { password: new FormData(e.currentTarget).get('password') } })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="a-login">
      <form className="a-card a-login-card" onSubmit={submit}>
        <div className="a-brand">Hadi Korish <span>Admin</span></div>
        <label className="a-field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" autoFocus required />
        </label>
        {error && <p className="a-error">{error}</p>}
        <button className="a-btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="a-muted-link">← Back to site</a>
      </form>
    </div>
  )
}

/* ---------- uploads ---------- */

const MAX_UPLOAD = 1.9 * 1024 * 1024 // D1 stores at most 2 MB per file

function canvasBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

// Resize to at most 1600px and re-encode as WebP (JPEG where the browser can't encode WebP)
// until the file fits in the database. GIFs are kept as-is so they stay animated.
async function shrinkImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  for (const quality of [0.86, 0.75, 0.6, 0.45]) {
    let blob = await canvasBlob(canvas, 'image/webp', quality)
    if (blob?.type !== 'image/webp') blob = await canvasBlob(canvas, 'image/jpeg', quality)
    if (blob && blob.size <= MAX_UPLOAD) {
      if (blob.size >= file.size && file.size <= MAX_UPLOAD) return file
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.' + ext, { type: blob.type })
    }
  }
  return file
}

function UploadField({ label, value, onChange, accept = 'image/*', hint, toast }) {
  const [busy, setBusy] = useState(false)
  async function upload(e) {
    const picked = e.target.files?.[0]
    if (!picked) return
    setBusy(true)
    try {
      const file = await shrinkImage(picked)
      if (file.size > MAX_UPLOAD) throw new Error('File is larger than 1.9 MB — please use a smaller one')
      const body = new FormData()
      body.append('file', file)
      const { url } = await api('/admin/upload', { method: 'POST', body })
      onChange(url)
      toast('Uploaded')
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }
  const preview = mediaUrl(value)
  return (
    <div className="a-field">
      <span>{label}</span>
      <div className="a-upload">
        {preview && accept.startsWith('image') && <img src={preview} alt="" />}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://… or upload" />
        <label className="a-btn small">
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept={accept} onChange={upload} hidden disabled={busy} />
        </label>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  )
}

/* ---------- overview ---------- */

function Overview({ goTo }) {
  const [s, setS] = useState(null)
  useEffect(() => { api('/admin/stats').then(setS).catch(() => setS(false)) }, [])
  if (s === null) return <p className="a-muted">Loading…</p>
  if (s === false) return <p className="a-error">Couldn't load stats.</p>

  // Fill missing days so the chart always shows 30 bars.
  const byDay = Object.fromEntries(s.daily.map(d => [d.day, d.n]))
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10)
    return { day: d, n: byDay[d] || 0 }
  })
  const max = Math.max(1, ...days.map(d => d.n))

  return (
    <>
      <div className="a-stats">
        {[
          ['Visitors today', s.visitors_day],
          ['Last 7 days', s.visitors_week],
          ['Last 30 days', s.visitors_month],
          ['All time', s.visitors_total],
          ['Projects', s.projects, 'projects'],
          ['Unread messages', s.unread, 'messages'],
        ].map(([label, n, tab]) => (
          <button key={label} className={`a-card a-stat ${tab ? 'link' : ''}`} onClick={tab ? () => goTo(tab) : undefined} disabled={!tab}>
            <div className="n">{n}</div>
            <div className="l">{label}</div>
          </button>
        ))}
      </div>

      <div className="a-card">
        <h3>Visitors, last 30 days</h3>
        <div className="a-chart" role="img" aria-label="Daily visitors for the last 30 days">
          {days.map(d => (
            <div key={d.day} className="a-bar" style={{ height: `${(d.n / max) * 100}%` }} title={`${d.day}: ${d.n}`} />
          ))}
        </div>
        <div className="a-chart-axis"><span>{days[0].day}</span><span>Today</span></div>
      </div>

      <div className="a-two">
        <div className="a-card">
          <h3>Top referrers (30 days)</h3>
          {s.referrers.length === 0 ? <p className="a-muted">No referrers yet — most visits are direct.</p> : (
            <ul className="a-list">
              {s.referrers.map(r => <li key={r.host}><span>{r.host}</span><b>{r.n}</b></li>)}
            </ul>
          )}
        </div>
        <div className="a-card">
          <h3>Recent visits</h3>
          <ul className="a-list small">
            {s.recent.map((v, i) => (
              <li key={i}>
                <span title={v.user_agent}>{/mobile/i.test(v.user_agent) ? '📱' : '🖥️'} {v.referrer ? new URL(v.referrer, location.href).hostname : 'direct'}</span>
                <b>{fmtDate(v.created_at)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- projects ---------- */

function ProjectForm({ initial, onSaved, onCancel, toast }) {
  const [p, setP] = useState({ ...EMPTY_PROJECT, ...initial, featured: !!initial?.featured })
  const [busy, setBusy] = useState(false)
  const set = key => e => setP(prev => ({ ...prev, [key]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const saved = initial?.id
        ? await api(`/admin/projects/${initial.id}`, { method: 'PUT', body: p })
        : await api('/admin/projects', { method: 'POST', body: p })
      toast(initial?.id ? 'Project updated' : 'Project added')
      onSaved(saved)
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="a-card a-form" onSubmit={save}>
      <h3>{initial?.id ? `Edit “${initial.name}”` : 'New project'}</h3>
      <div className="a-grid">
        <label className="a-field"><span>Name *</span><input value={p.name} onChange={set('name')} required maxLength={160} /></label>
        <label className="a-field"><span>Type *</span>
          <select value={p.type} onChange={set('type')}>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v.en}</option>)}
          </select>
        </label>
        <div className="full"><UploadField label="Cover image" value={p.photo} onChange={set('photo')} toast={toast}
          hint="Phone screenshots (taller than wide) are shown inside a phone frame automatically." /></div>
        <label className="a-field full"><span>Short description * <em>shown on the card</em></span>
          <textarea value={p.description} onChange={set('description')} required rows={2} maxLength={600} /></label>
        <label className="a-field full"><span>Case study <em>shown when the card is opened — leave a blank line between paragraphs</em></span>
          <textarea value={p.details} onChange={set('details')} rows={6} maxLength={8000}
            placeholder={'The problem…\n\nWhat I built…\n\nThe result…'} /></label>
        <label className="a-field"><span>Tech used <em>comma separated</em></span>
          <input value={p.tech} onChange={set('tech')} placeholder="Laravel, React, MySQL" /></label>
        <label className="a-field"><span>Project link *</span>
          <input value={p.link} onChange={set('link')} required placeholder="https://…" /></label>
        <label className="a-field full"><span>Preview video link <em>direct .mp4 / .webm link</em></span>
          <input value={p.video_url} onChange={set('video_url')} placeholder="/videos/my-reel.mp4 or https://…/clip.mp4" />
          <small>Plays silently when someone hovers the card, and in the case study. Videos are too big for the database:
            put a short clip (5–15 s, under 25 MB) in the repo's <code>public/videos/</code> folder and link it as <code>/videos/name.mp4</code>.</small>
        </label>
        <label className="a-check full"><input type="checkbox" checked={p.featured} onChange={set('featured')} />
          <span>Featured — shown first and full width</span></label>
      </div>
      <div className="a-actions">
        <button type="button" className="a-btn" onClick={onCancel}>Cancel</button>
        <button className="a-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save project'}</button>
      </div>
    </form>
  )
}

function Projects({ toast }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const load = useCallback(() => api('/admin/projects').then(setList).catch(err => toast(err.message, 'err')), [toast])
  useEffect(() => { load() }, [load])

  async function move(index, delta) {
    const next = [...list]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setList(next)
    try {
      await api('/admin/projects/reorder', { method: 'POST', body: { ids: next.map(p => p.id) } })
    } catch (err) {
      toast(err.message, 'err')
      load()
    }
  }

  async function remove(p) {
    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return
    try {
      await api(`/admin/projects/${p.id}`, { method: 'DELETE' })
      toast('Project deleted')
      load()
    } catch (err) {
      toast(err.message, 'err')
    }
  }

  if (editing) {
    return <ProjectForm initial={editing === 'new' ? null : editing} toast={toast}
      onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
  }
  return (
    <>
      <div className="a-head">
        <p className="a-muted">Featured projects always show first. Use the arrows to set the order of the rest.</p>
        <button className="a-btn primary" onClick={() => setEditing('new')}>+ Add project</button>
      </div>
      {list === null ? <p className="a-muted">Loading…</p> : list.length === 0 ? (
        <div className="a-card a-empty">No projects yet.</div>
      ) : (
        <div className="a-rows">
          {list.map((p, i) => (
            <div className="a-card a-row" key={p.id}>
              <div className="a-thumb">{mediaUrl(p.photo) && <img src={mediaUrl(p.photo)} alt="" loading="lazy" />}</div>
              <div className="a-row-main">
                <div className="a-row-title">{p.name} {!!p.featured && <span className="a-badge">Featured</span>}</div>
                <div className="a-row-sub">{typeLabels[p.type]?.en || p.type} · {p.description}</div>
              </div>
              <div className="a-row-actions">
                <button className="a-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="a-icon" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
                <button className="a-btn small" onClick={() => setEditing(p)}>Edit</button>
                <button className="a-btn small danger" onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- testimonials ---------- */

function Testimonials({ toast }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const load = useCallback(() => api('/admin/testimonials').then(setList).catch(err => toast(err.message, 'err')), [toast])
  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(e.currentTarget))
    try {
      if (editing.id) await api(`/admin/testimonials/${editing.id}`, { method: 'PUT', body })
      else await api('/admin/testimonials', { method: 'POST', body })
      toast('Saved')
      setEditing(null)
      load()
    } catch (err) {
      toast(err.message, 'err')
    }
  }
  async function remove(q) {
    if (!confirm(`Delete the quote from ${q.name}?`)) return
    await api(`/admin/testimonials/${q.id}`, { method: 'DELETE' }).catch(err => toast(err.message, 'err'))
    load()
  }

  if (editing) {
    return (
      <form className="a-card a-form" onSubmit={save}>
        <h3>{editing.id ? 'Edit testimonial' : 'New testimonial'}</h3>
        <div className="a-grid">
          <label className="a-field"><span>Name *</span><input name="name" defaultValue={editing.name} required /></label>
          <label className="a-field"><span>Role / company</span><input name="role" defaultValue={editing.role} placeholder="Founder, Acme" /></label>
          <label className="a-field full"><span>Quote *</span><textarea name="quote" defaultValue={editing.quote} rows={4} required /></label>
          <label className="a-field"><span>Order</span><input name="sort_order" type="number" defaultValue={editing.sort_order} /></label>
        </div>
        <div className="a-actions">
          <button type="button" className="a-btn" onClick={() => setEditing(null)}>Cancel</button>
          <button className="a-btn primary">Save</button>
        </div>
      </form>
    )
  }
  return (
    <>
      <div className="a-head">
        <p className="a-muted">The testimonials section only appears on the site once you add at least one.</p>
        <button className="a-btn primary" onClick={() => setEditing(EMPTY_QUOTE)}>+ Add testimonial</button>
      </div>
      {list === null ? <p className="a-muted">Loading…</p> : list.length === 0 ? (
        <div className="a-card a-empty">No testimonials yet. Ask a happy client for two sentences!</div>
      ) : (
        <div className="a-rows">
          {list.map(q => (
            <div className="a-card a-row" key={q.id}>
              <div className="a-row-main">
                <div className="a-row-title">{q.name} {q.role && <span className="a-muted">· {q.role}</span>}</div>
                <div className="a-row-sub">“{q.quote}”</div>
              </div>
              <div className="a-row-actions">
                <button className="a-btn small" onClick={() => setEditing(q)}>Edit</button>
                <button className="a-btn small danger" onClick={() => remove(q)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- messages ---------- */

function Messages({ toast, onChange }) {
  const [list, setList] = useState(null)
  const load = useCallback(() => api('/admin/messages').then(setList).catch(err => toast(err.message, 'err')), [toast])
  useEffect(() => { load() }, [load])

  async function setRead(m, is_read) {
    await api(`/admin/messages/${m.id}`, { method: 'PATCH', body: { is_read } }).catch(err => toast(err.message, 'err'))
    load(); onChange()
  }
  async function remove(m) {
    if (!confirm(`Delete the message from ${m.name}?`)) return
    await api(`/admin/messages/${m.id}`, { method: 'DELETE' }).catch(err => toast(err.message, 'err'))
    load(); onChange()
  }

  if (list === null) return <p className="a-muted">Loading…</p>
  if (list.length === 0) return <div className="a-card a-empty">No messages yet. They'll show up here when someone uses the contact form.</div>
  return (
    <div className="a-rows">
      {list.map(m => (
        <div className={`a-card a-msg ${m.is_read ? '' : 'unread'}`} key={m.id}>
          <div className="a-msg-head">
            <div>
              <strong>{m.name}</strong> <a href={`mailto:${m.email}?subject=Re:%20your%20project`}>{m.email}</a>
            </div>
            <span className="a-muted">{fmtDate(m.created_at)}</span>
          </div>
          <p className="a-msg-body">{m.message}</p>
          <div className="a-row-actions">
            <a className="a-btn small primary" href={`mailto:${m.email}?subject=Re:%20your%20project`} onClick={() => !m.is_read && setRead(m, true)}>Reply</a>
            <button className="a-btn small" onClick={() => setRead(m, !m.is_read)}>{m.is_read ? 'Mark unread' : 'Mark read'}</button>
            <button className="a-btn small danger" onClick={() => remove(m)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- settings ---------- */

function Notifications({ toast }) {
  const [on, setOn] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api('/admin/notify-status').then(setOn).catch(() => setOn(false)) }, [])
  async function test() {
    setBusy(true)
    try {
      const { sent } = await api('/admin/notify-test', { method: 'POST' })
      toast(`Test sent via ${sent.join(' and ')}`)
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }
  const row = (label, active, how) => (
    <li><span>{label}</span><b className={active ? 'a-on' : ''}>{active ? 'On' : how}</b></li>
  )
  return (
    <div className="a-card a-form">
      <h3>Message notifications</h3>
      <p className="a-muted">Get told the moment someone uses the contact form. Channels switch on when their secrets are set in Cloudflare (see README).</p>
      {on && (
        <ul className="a-list">
          {row('Telegram', on.telegram, 'Off — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID')}
          {row('Email', on.email, 'Off — set RESEND_API_KEY and NOTIFY_EMAIL')}
        </ul>
      )}
      <div className="a-actions">
        <button className="a-btn" onClick={test} disabled={busy || !on || (!on.telegram && !on.email)}>
          {busy ? 'Sending…' : 'Send test notification'}
        </button>
      </div>
    </div>
  )
}

function Settings({ toast }) {
  const [s, setS] = useState(null)
  useEffect(() => { api('/admin/settings').then(setS).catch(err => toast(err.message, 'err')) }, [toast])
  async function save(next) {
    setS(next)
    try {
      setS(await api('/admin/settings', { method: 'PUT', body: next }))
      toast('Settings saved')
    } catch (err) {
      toast(err.message, 'err')
    }
  }
  if (!s) return <p className="a-muted">Loading…</p>
  return (
    <div className="a-card a-form">
      <h3>Site settings</h3>
      <label className="a-check">
        <input type="checkbox" checked={s.available !== '0'} onChange={e => save({ ...s, available: e.target.checked ? '1' : '0' })} />
        <span>Show “Available for new projects” badge (turn off when you're fully booked)</span>
      </label>
      <UploadField label="CV / résumé (PDF)" value={s.cv_url || ''} accept="application/pdf" toast={toast}
        onChange={url => setS({ ...s, cv_url: url })}
        hint="Adds a “Download CV” button to the About section (PDF under 1.9 MB). Leave empty to hide it." />
      <div className="a-actions">
        <button className="a-btn primary" onClick={() => save(s)}>Save CV link</button>
      </div>
    </div>
  )
}

/* ---------- shell ---------- */

export default function Admin() {
  const [authed, setAuthed] = useState(null)
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'overview')
  const [unread, setUnread] = useState(0)
  const [toast, toastNode] = useToast()

  useEffect(() => {
    document.title = 'Admin — Hadi Korish'
    document.documentElement.dir = 'ltr'
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = 'noindex, nofollow'
    api('/admin/me').then(() => setAuthed(true)).catch(() => setAuthed(false))
  }, [])

  const refreshUnread = useCallback(() => {
    api('/admin/stats').then(s => setUnread(s.unread)).catch(() => {})
  }, [])
  useEffect(() => { if (authed) refreshUnread() }, [authed, refreshUnread])

  const goTo = t => { setTab(t); history.replaceState(null, '', `#${t}`) }
  async function logout() {
    await api('/admin/logout', { method: 'POST' }).catch(() => {})
    setAuthed(false)
  }

  if (authed === null) return <div className="admin"><p className="a-muted a-center">Loading…</p></div>
  if (!authed) return <div className="admin"><Login onDone={() => setAuthed(true)} /></div>

  return (
    <div className="admin">
      <header className="a-top">
        <div className="a-brand">Hadi Korish <span>Admin</span></div>
        <nav className="a-tabs">
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => goTo(key)}>
              {label}{key === 'messages' && unread > 0 && <i>{unread}</i>}
            </button>
          ))}
        </nav>
        <div className="a-top-right">
          <a href="/" target="_blank" rel="noopener" className="a-btn small">View site ↗</a>
          <button className="a-btn small" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="a-main">
        <h1>{TABS.find(([k]) => k === tab)?.[1]}</h1>
        {tab === 'overview' && <Overview goTo={goTo} />}
        {tab === 'projects' && <Projects toast={toast} />}
        {tab === 'testimonials' && <Testimonials toast={toast} />}
        {tab === 'messages' && <Messages toast={toast} onChange={refreshUnread} />}
        {tab === 'settings' && <><Settings toast={toast} /><Notifications toast={toast} /></>}
      </main>
      {toastNode}
    </div>
  )
}
