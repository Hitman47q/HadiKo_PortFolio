import { useEffect, useRef, useState } from 'react'
import { getInitialLang, tools, translations } from '../i18n.js'
import { api, mediaUrl } from '../lib/api.js'
import Hero from './Hero.jsx'
import Work from './Work.jsx'
import { CountUp, tiltHandlers, useReveal } from './motion.jsx'
import './site.css'

const EMAIL = 'hadimc24@gmail.com'
const SOCIALS = [
  { label: 'Whatsapp', href: 'https://wa.me/963998548611' },
  { label: 'Instagram', href: 'https://www.instagram.com/hadik.motion' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hadi-korish-838a75430' },
  { label: 'GitHub', href: 'https://github.com/Hitman47q' },
]
const SWATCHES = ['var(--gold)', 'var(--violet)', 'var(--rose)']

function useLang() {
  const [lang, setLang] = useState(getInitialLang)
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])
  const toggle = () => {
    const next = lang === 'en' ? 'ar' : 'en'
    setLang(next)
    try { localStorage.setItem('lang', next) } catch { /* storage blocked */ }
  }
  return [lang, toggle]
}

function Nav({ t, lang, toggleLang, navRef }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const links = [['#services', t.navServices], ['#work', t.navWork], ['#about', t.navAbout], ['#contact', t.navContact]]
  return (
    <>
      <nav className="nav" ref={navRef} aria-label="Main">
        <a href="#top" className="nav-name">Hadi Korish</a>
        <div className="nav-links">
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </div>
        <div className="nav-right">
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <a href="#contact" className="nav-cta">{t.navCta}</a>
          <button
            className={`burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.close : t.menu}
          >
            <span /><span />
          </button>
        </div>
      </nav>
      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {links.map(([href, label], i) => (
          <a key={href} href={href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} style={{ '--i': i }}>
            <small>0{i + 1}</small>{label}
          </a>
        ))}
        <a href="#contact" className="btn btn-primary" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {t.navCta} <b aria-hidden="true">→</b>
        </a>
      </div>
    </>
  )
}

function ContactForm({ t }) {
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    setState('sending')
    try {
      await api('/messages', { method: 'POST', body: Object.fromEntries(new FormData(form)) })
      form.reset()
      setState('sent')
    } catch (err) {
      setError(err.status === 400 || err.status === 429 ? err.message : t.formError)
      setState('error')
    }
  }
  if (state === 'sent') return <div className="form-done" role="status">{t.formSent}</div>
  return (
    <form className="contact-form" onSubmit={onSubmit} data-reveal>
      <label><span>{t.formName}</span><input name="name" required maxLength={120} autoComplete="name" /></label>
      <label><span>{t.formEmail}</span><input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label className="full"><span>{t.formMessage}</span><textarea name="message" required rows={5} maxLength={5000} /></label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state === 'error' && <p className="form-error full" role="alert">{error}</p>}
      <button className="btn btn-primary full" disabled={state === 'sending'}>
        {state === 'sending' ? t.formSending : t.formSend} <b aria-hidden="true">→</b>
      </button>
    </form>
  )
}

export function NotFound() {
  const [lang] = useLang()
  const t = translations[lang]
  useEffect(() => { document.title = '404 — Hadi Korish' }, [])
  return (
    <main className="not-found">
      <div className="grid" />
      <div className="nf-code">404</div>
      <h1>{t.notFoundTitle}</h1>
      <p>{t.notFoundText}</p>
      <a href="/" className="btn btn-primary">{t.notFoundCta} <b aria-hidden="true">→</b></a>
    </main>
  )
}

export default function Site() {
  const [lang, toggleLang] = useLang()
  const t = translations[lang]
  const navRef = useRef(null)
  const [data, setData] = useState({ projects: [], testimonials: [], settings: {} })
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api('/public')
      .then(d => { setData(d); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    try {
      if (sessionStorage.getItem('tracked')) return
      sessionStorage.setItem('tracked', '1')
    } catch { /* storage blocked */ }
    api('/track', { method: 'POST', body: { url: location.href, referrer: document.referrer } }).catch(() => {})
  }, [])

  useReveal([lang, data])

  const { settings, testimonials } = data
  const available = status === 'ready' ? settings.available !== '0' : undefined
  const cv = mediaUrl(settings.cv_url)

  return (
    <>
      <a className="skip" href="#about">Skip to content</a>
      <Nav t={t} lang={lang} toggleLang={toggleLang} navRef={navRef} />
      <Hero t={t} lang={lang} navRef={navRef} available={available} />

      <main>
        <section className="about" id="about">
          <div className="container">
            <div className="tag" data-reveal>{t.aboutTag}</div>
            <div className="intro-grid">
              <p className="intro-lede" data-reveal>{t.aboutLede}</p>
              <div className="intro-body" data-reveal>
                <p dangerouslySetInnerHTML={{ __html: t.aboutP1 }} />
                <p>{t.aboutP2}</p>
                <div className="stat-row">
                  {t.stats.map(s => (
                    <div className="stat" key={s.lbl}>
                      <div className="num"><CountUp value={s.num} /></div>
                      <div className="lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                {cv && (
                  <a className="btn btn-ghost" href={cv} target="_blank" rel="noopener noreferrer" download>
                    {t.downloadCv} <b aria-hidden="true">↓</b>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="tools" aria-label={t.toolsLabel}>
          <div className="tools-track">
            {[0, 1].map(copy => (
              <div className="tools-set" key={copy} aria-hidden={copy === 1}>
                {tools.map(tool => <span key={tool}>{tool}</span>)}
              </div>
            ))}
          </div>
        </div>

        <section className="section-pad" id="services">
          <div className="container">
            <div className="tag2" data-reveal>{t.servicesTag}</div>
            <div className="section-head" data-reveal>
              <h2>{t.servicesH2}</h2>
              <p>{t.servicesP}</p>
            </div>
            <div className="services-list">
              {t.services.map((s, i) => (
                <div className="service-row" key={s.name} data-reveal>
                  <div className="service-name">
                    <span className="service-num">0{i + 1}</span>
                    <span className="swatch" style={{ background: SWATCHES[i] }} />
                    {s.name}
                  </div>
                  <div className="service-desc">
                    <p>{s.desc}</p>
                    <div className="chip-row">{s.chips.map(c => <span className="chip" key={c}>{c}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Work t={t} lang={lang} projects={data.projects} status={status} />

        <section className="section-pad">
          <div className="container">
            <div className="tag2" data-reveal>{t.processTag}</div>
            <div className="section-head" data-reveal><h2>{t.processH2}</h2></div>
            <div className="process-grid">
              {t.process.map((step, i) => (
                <div className="process-card glow-card" key={step.title} data-reveal style={{ '--delay': `${i * 90}ms` }} {...tiltHandlers(6)}>
                  <div className="step-num">0{i + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="section-pad testimonials">
            <div className="container">
              <div className="tag2" data-reveal>{t.testimonialsTag}</div>
              <div className="section-head" data-reveal><h2>{t.testimonialsH2}</h2></div>
              <div className="quote-grid">
                {testimonials.map((q, i) => (
                  <figure className="quote glow-card" key={q.id} data-reveal style={{ '--delay': `${i * 90}ms` }} {...tiltHandlers(4)}>
                    <blockquote>“{q.quote}”</blockquote>
                    <figcaption><strong>{q.name}</strong>{q.role && <span>{q.role}</span>}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="contact" id="contact">
          <div className="container contact-inner">
            <div className="contact-copy" data-reveal>
              <div className="tag2 start">{t.contactTag}</div>
              <h2>{t.contactH2}</h2>
              <p className="contact-note">{t.contactNote}</p>
              {available !== undefined && (
                <span className={`status-pill ${available ? 'is-on' : ''}`}><i aria-hidden="true" />{available ? t.available : t.booked}</span>
              )}
              <div className="contact-direct">
                <span>{t.orEmail}</span>
                <a href={`mailto:${EMAIL}?subject=Project%20inquiry`} className="contact-email">{EMAIL}</a>
              </div>
              <div className="socials">
                {SOCIALS.map(s => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
              </div>
            </div>
            <ContactForm t={t} />
          </div>
          <footer className="container foot">
            <span>{t.footerCopy}</span>
            <a href="#top" className="to-top">{t.backToTop} ↑</a>
            <span>{t.footerThanks}</span>
          </footer>
        </section>
      </main>
    </>
  )
}
