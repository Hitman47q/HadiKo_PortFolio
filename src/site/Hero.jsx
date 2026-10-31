import { useEffect, useRef, useState } from 'react'

// Frame sequences cut from the Seedance videos (see seedance/PROMPTS.md):
// 97 WebP frames each, landscape for wide screens and portrait for tall ones.
const SETS = {
  d: { count: 97, w: 1280, h: 720, focusX: 0.72, poster: '/hero/poster-d.webp' },
  m: { count: 97, w: 720, h: 1280, focusX: 0.5, poster: '/hero/poster-m.webp' },
}
const frameUrl = (set, i) => `/hero/${set}/${String(i + 1).padStart(3, '0')}.webp`

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const range = (p, a, b) => clamp((p - a) / (b - a))
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const pickSet = () => (window.innerWidth / window.innerHeight < 1 ? 'm' : 'd')

export default function Hero({ t, lang, navRef, available }) {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const copyRef = useRef(null)
  const nextRef = useRef(null)
  const progressRef = useRef(null)
  const hintRef = useRef(null)
  const [set, setSet] = useState(pickSet)
  const [ready, setReady] = useState(false)
  const rtlRef = useRef(lang === 'ar')
  useEffect(() => { rtlRef.current = lang === 'ar' }, [lang])

  // Switch between the landscape and portrait sequence when the screen shape changes.
  useEffect(() => {
    const onResize = () => setSet(pickSet())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const nav = navRef.current
    const { count, w: fw, h: fh, focusX } = SETS[set]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frames = new Array(count)
    let cancelled = false, current = 0, needsDraw = true, rafId = 0, running = false
    setReady(false)

    // Load coarse-to-fine (every 8th frame, then 4th, 2nd, all) so scrubbing works
    // almost immediately and gets smoother as the rest arrive.
    const order = []
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i)
    }
    if (!order.includes(count - 1)) order.splice(1, 0, count - 1)
    let next = 0
    const loadOne = () => {
      if (cancelled || next >= order.length) return
      const i = order[next++]
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
        frames[i] = img
        needsDraw = true
        if (i === 0) setReady(true)
        loadOne()
      }
      img.onerror = loadOne
      img.src = frameUrl(set, i)
    }
    if (!reduced) for (let k = 0; k < 4; k++) loadOne()

    // Canvas sizing: cached, and refreshed only when the width changes, so the mobile
    // address bar showing/hiding (height-only resize) never causes a jump.
    let vw = 0, cw = 0, ch = 0, total = 1
    const measure = () => {
      vw = window.innerWidth
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cw = Math.round(canvas.clientWidth * dpr)
      ch = Math.round(canvas.clientHeight * dpr)
      canvas.width = cw
      canvas.height = ch
      total = Math.max(1, stage.offsetHeight - window.innerHeight)
      needsDraw = true
    }
    const onResize = () => { if (window.innerWidth !== vw) measure() }

    const nearest = i => {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return frames[i - d]
        if (frames[i + d]) return frames[i + d]
      }
      return null
    }
    // "cover" fit, keeping the subject (focusX) in view when the sides get cropped.
    const drawImage = (img, alpha) => {
      const scale = Math.max(cw / fw, ch / fh)
      const dw = fw * scale, dh = fh * scale
      const dx = (cw - dw) * focusX, dy = (ch - dh) / 2
      ctx.globalAlpha = alpha
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    const progressOf = () => clamp(-stage.getBoundingClientRect().top / total)

    let lastTime = performance.now()
    function draw(p) {
      const now = performance.now()
      const dt = Math.min(250, now - lastTime)
      lastTime = now
      const target = p * (count - 1)
      // Ease toward the scroll position for a smooth, slightly weighted feel. Time-based,
      // so it catches up at the same speed on slow devices that render fewer frames.
      current += (target - current) * (1 - Math.exp(-dt / 70))
      if (Math.abs(target - current) < 0.01) current = target
      const i = Math.floor(current)
      const frac = current - i
      const a = frames[i] || nearest(i)
      if (a) {
        ctx.globalCompositeOperation = 'source-over'
        drawImage(a, 1)
        // Cross-fade into the next frame for in-between scroll positions.
        const b = frac > 0.02 && frames[i + 1]
        if (b && a === frames[i]) drawImage(b, frac)
        ctx.globalAlpha = 1
      }

      const dir = rtlRef.current ? -1 : 1
      const out = ease(range(p, 0.06, 0.3))
      copyRef.current.style.opacity = 1 - out
      copyRef.current.style.transform = `translate3d(${-dir * out * 40}px, ${-out * 50}px, 0)`
      hintRef.current.style.opacity = 1 - range(p, 0, 0.08)
      progressRef.current.style.transform = `scaleX(${p})`
      const nextIn = range(p, 0.72, 0.9)
      nextRef.current.style.opacity = nextIn
      nextRef.current.style.transform = `translateY(${24 * (1 - nextIn)}px)`
      nav.classList.toggle('scrolled', p > 0.2)
      return current !== target
    }

    // Redraw only after a scroll, resize or newly loaded frame, and while easing toward the target.
    function loop() {
      if (needsDraw) needsDraw = draw(progressOf())
      else lastTime = performance.now()
      rafId = requestAnimationFrame(loop)
    }

    const onScroll = () => {
      needsDraw = true
      if (reduced) nav.classList.toggle('scrolled', window.scrollY > 40)
    }

    measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (reduced) {
      onScroll()
      return () => {
        cancelled = true
        window.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', measure)
        window.removeEventListener('scroll', onScroll)
      }
    }

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; current = progressOf() * (count - 1); rafId = requestAnimationFrame(loop) }
      if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(rafId) }
    })
    io.observe(stage)

    return () => {
      cancelled = true
      io.disconnect()
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', measure)
      window.removeEventListener('scroll', onScroll)
    }
  }, [set, navRef])

  return (
    <>
      <div className="progress" ref={progressRef} />
      <section className="scroll-stage" id="top" ref={stageRef}>
        <div className="sticky">
          <img
            className={`hero-poster ${ready ? 'is-hidden' : ''}`}
            src={SETS[set].poster}
            alt=""
            fetchPriority="high"
            style={{ objectPosition: `${SETS[set].focusX * 100}% 50%` }}
          />
          <canvas className="hero-canvas" ref={canvasRef} aria-label="Hadi Korish standing in front of a gold-framed glass screen that shatters as you scroll" role="img" />
          <div className="hero-shade" />
          <div className="noise" />

          <div className="copy" ref={copyRef}>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>
              <span>HADI</span>
              <span className="last">KORISH</span>
            </h1>
            <div className="role">{t.role1}<br />{t.role2}</div>
            <p className="desc">{t.desc}</p>
            <div className="hero-actions">
              <a className="cta" href="#work">{t.cta} <b aria-hidden="true">→</b></a>
              {available !== undefined && (
                <span className={`status-pill ${available ? 'is-on' : ''}`}>
                  <i aria-hidden="true" />{available ? t.available : t.booked}
                </span>
              )}
            </div>
          </div>

          <div className="micro follow" aria-hidden="true">{t.follow}</div>
          <div className="scroll-label" ref={hintRef} aria-hidden="true">{t.scrollLabel}<div className="scroll-line" /></div>
          <div className="next-section" ref={nextRef} aria-hidden="true">{t.nextSection}</div>
        </div>
      </section>
    </>
  )
}
