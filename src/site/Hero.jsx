import { useEffect, useRef } from 'react'

const SHARDS = [
  { w: 90, h: 160, x: '64%', y: '20%', tx: 90, ty: -120, tz: 260, r: 30 },
  { w: 120, h: 70, x: '70%', y: '33%', tx: 170, ty: -25, tz: 220, r: -22 },
  { w: 75, h: 110, x: '58%', y: '46%', tx: -130, ty: 50, tz: 190, r: -40 },
  { w: 140, h: 80, x: '76%', y: '52%', tx: 180, ty: 120, tz: 240, r: 45 },
  { w: 60, h: 130, x: '66%', y: '66%', tx: -110, ty: 160, tz: 200, r: 65 },
  { w: 95, h: 65, x: '82%', y: '25%', tx: 210, ty: -100, tz: 180, r: -55 },
  { w: 45, h: 90, x: '54%', y: '58%', tx: -170, ty: 110, tz: 160, r: 20 },
  { w: 80, h: 45, x: '74%', y: '72%', tx: 150, ty: 190, tz: 210, r: -30 },
]

const PLACEHOLDER = 'data:image/webp;base64,UklGRmABAABXRUJQVlA4WAoAAAAQAAAADwAAFwAAQUxQSLcAAAABgGPb2rHn+WOjtY1OtZPO7O0R2FatXp0xAJsDSCobX573Ft/zvWOIiAkgS1fS9x05n/fQGgZQpbUARqtWF5SRqJX+jzVnrZg35JG1XXT5KVCk0fsNsLrOd5dsR2BmBq6SpF2BFWYEWpEYD35CuwVjSgi4g8Wzn4n6JeDeR6gU1HJDDonTArZJdryQPsOlNEOZGNXSKFjatJmcL6w+gkx2JYaSdvxNlKeYlWJGAYltYPVwq5SRTEQAVlA4IIIAAACwAwCdASoQABgAPu1iqU2ppaOiMAgBMB2JYwCdICXgqBD72WUwMAD9IY/pYpn7WESbAyUeTOFeMXbyslbPJPRGLSKyuJOSB0682oFpRbvomcmsatRDsRP4Y72dUTCH3aQatheeKWADjq4ULH/b4wXCk+bYxUwqf2NUA/yP71mtAAAA'

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const range = (p, a, b) => clamp((p - a) / (b - a))

export default function Hero({ t, lang, navRef, available }) {
  const stageRef = useRef(null)
  const copyRef = useRef(null)
  const frameRef = useRef(null)
  const portraitRef = useRef(null)
  const nextRef = useRef(null)
  const progressRef = useRef(null)
  const firstRef = useRef(null)
  const lastRef = useRef(null)
  const shardsRef = useRef(null)
  const rtlRef = useRef(lang === 'ar')
  useEffect(() => { rtlRef.current = lang === 'ar' }, [lang])

  useEffect(() => {
    const stage = stageRef.current
    const nav = navRef.current
    const els = {
      copy: copyRef.current, frame: frameRef.current, portrait: portraitRef.current,
      next: nextRef.current, progress: progressRef.current, first: firstRef.current, last: lastRef.current,
    }
    const shards = [...shardsRef.current.querySelectorAll('.shard')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Viewport size is cached and only refreshed when the *width* changes, so the
    // mobile address bar showing/hiding (height-only resize) never makes the animation jump.
    let vw = window.innerWidth, vh = window.innerHeight, total = 1, mobile = false, k = 1
    const measure = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      mobile = vw <= 800
      // All pixel offsets were tuned for a 1440px screen; scale them to the current one.
      k = clamp(vw / 1440, 0.32, 1.1)
      total = Math.max(1, stage.offsetHeight - vh)
    }
    measure()
    const onResize = () => { if (window.innerWidth !== vw) measure() }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', measure)

    const progressOf = () => clamp(-stage.getBoundingClientRect().top / total)
    const onScroll = () => {
      const scrolled = reduced ? window.scrollY > 40 : progressOf() > 0.74
      nav.classList.toggle('scrolled', scrolled)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    if (reduced) {
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', measure)
      }
    }

    let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0, rafId = 0, running = false, lastP = -1
    const onPointer = e => {
      if (e.pointerType !== 'mouse') return
      mouseX = (e.clientX / vw - 0.5) * 2
      mouseY = (e.clientY / vh - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    function render() {
      smoothX += (mouseX * 3.5 - smoothX) * 0.06
      smoothY += (mouseY * 2.2 - smoothY) * 0.06
      const p = progressOf()
      const moving = Math.abs(mouseX * 3.5 - smoothX) > 0.01 || Math.abs(mouseY * 2.2 - smoothY) > 0.01
      if (p !== lastP || moving) {
        lastP = p
        draw(p)
      }
      rafId = requestAnimationFrame(render)
    }

    function draw(p) {
      const dir = rtlRef.current ? -1 : 1
      const { copy, frame, portrait, next, progress, first, last } = els
      progress.style.transform = `scaleX(${p})`

      const intro = ease(range(p, 0, 0.18))
      const breakIn = ease(range(p, 0.14, 0.34))
      const burst = ease(range(p, 0.28, 0.55))
      const exit = ease(range(p, 0.54, 0.78))
      const finish = ease(range(p, 0.76, 1))

      if (mobile) {
        // Phone: keep everything inside the screen. Text lifts and fades,
        // the portrait rises and grows a little, the frame tilts away.
        copy.style.transform = `translate3d(0, ${-(breakIn * 40 + exit * 60)}px, 0) scale(${1 - exit * 0.08})`
        copy.style.opacity = 1 - range(p, 0.3, 0.62)
        first.style.transform = `translateX(${-dir * burst * 18}px)`
        last.style.transform = `translateX(${dir * burst * 22}px)`
        const scale = 1 + burst * 0.12 + exit * 0.08
        portrait.style.transform =
          `translate3d(0, ${-burst * vh * 0.1 - exit * vh * 0.06}px, 0) scale(${scale})`
        portrait.style.opacity = 1 - finish * 0.9
        frame.style.transform = `rotateY(${dir * (burst * 10 + exit * 30)}deg) rotateX(${exit * 10}deg) scale(${1 + exit * 0.1})`
        frame.style.opacity = 1 - burst * 0.95
      } else {
        const textScale = 1 - burst * 0.12 - exit * 0.18
        copy.style.transform =
          `translate3d(${-dir * breakIn * 160 * k}px, ${-exit * 80 * k}px, ${exit * 180 * k}px) scale(${textScale})`
        copy.style.opacity = 1 - exit * 0.95
        first.style.transform = `translateX(${-dir * burst * 120 * k}px)`
        last.style.transform = `translateX(${dir * burst * 130 * k}px)`

        const z = (-60 + burst * 480 - exit * 120) * k
        const x = (-burst * 40 + exit * 120) * k
        const y = (intro * 10 - exit * 190) * k
        const rotY = -4 + burst * 7 + exit * 16
        const rotX = burst * 2 - exit * 8
        const scale = 0.83 + burst * 0.22 + exit * 0.25
        portrait.style.transform =
          `translate3d(${x + smoothX}px, ${y + smoothY}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`
        portrait.style.opacity = 1 - finish * 0.88

        frame.style.transform =
          `translate3d(${(-burst * 40 + exit * 210) * k}px, ${(burst * 15 - exit * 60) * k}px, ${-burst * 20 * k}px) rotateY(${burst * 8 + exit * 48}deg) rotateX(${burst * 2 + exit * 18}deg) scale(${1 + exit * 0.18})`
        frame.style.opacity = 1 - burst * 0.92
      }

      const shardK = mobile ? k * 1.4 : k
      shards.forEach((s, i) => {
        const local = ease(clamp((burst - i * 0.018) / 0.7))
        const d = SHARDS[i]
        s.style.transform =
          `translate3d(${d.tx * shardK * local}px, ${d.ty * shardK * local}px, ${d.tz * shardK * local}px) rotate(${d.r * local}deg)`
        s.style.opacity = (0.85 * local * (1 - finish)).toFixed(3)
      })

      const nextIn = range(p, 0.64, 0.82)
      next.style.opacity = nextIn
      next.style.transform = `translateY(${30 * (1 - nextIn)}px)`
    }

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; rafId = requestAnimationFrame(render) }
      if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(rafId) }
    })
    io.observe(stage)

    return () => {
      io.disconnect()
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', measure)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [navRef])

  return (
    <>
      <div className="progress" ref={progressRef} />
      <section className="scroll-stage" id="top" ref={stageRef}>
        <div className="sticky">
          <div className="grid" />
          <div className="noise" />

          <div className="copy" ref={copyRef}>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>
              <span ref={firstRef}>HADI</span>
              <span className="last" ref={lastRef}>KORISH</span>
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

          <div className="screen-frame" ref={frameRef}><div className="glass" /></div>

          <div className="portrait-wrap" ref={portraitRef}>
            <img className="portrait portrait-ph" src={PLACEHOLDER} alt="" aria-hidden="true" />
            <picture>
              <source type="image/avif" srcSet="/me-640.avif 640w, /me.avif 1024w" sizes="(max-width: 800px) 70vw, 43vw" />
              <source type="image/webp" srcSet="/me-640.webp 640w, /me.webp 1024w" sizes="(max-width: 800px) 70vw, 43vw" />
              <img
                className="portrait"
                src="/me.webp"
                width="1024"
                height="1536"
                alt="Portrait of Hadi Korish"
                fetchPriority="high"
                ref={img => { if (img?.complete) img.classList.add('is-loaded') }}
                onLoad={e => e.currentTarget.classList.add('is-loaded')}
              />
            </picture>
          </div>

          <div className="shards" ref={shardsRef} aria-hidden="true">
            {SHARDS.map((s, i) => (
              <i key={i} className="shard" style={{ width: s.w, height: s.h, left: s.x, top: s.y }} />
            ))}
          </div>

          <div className="micro follow" aria-hidden="true">{t.follow}</div>
          <div className="scroll-label" aria-hidden="true">{t.scrollLabel}<div className="scroll-line" /></div>
          <div className="next-section" ref={nextRef} aria-hidden="true">{t.nextSection}</div>
        </div>
      </section>
    </>
  )
}
