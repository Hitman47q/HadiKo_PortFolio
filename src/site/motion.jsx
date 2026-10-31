import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Adds .is-in to every [data-reveal] element as it scrolls into view.
// Re-scans when `deps` change so content that loads later (projects) is picked up.
export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]:not(.is-in)')]
    if (reducedMotion()) { els.forEach(el => el.classList.add('is-in')); return }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// "20+" counts up from 0 to 20 the first time it's on screen, keeping the suffix.
export function CountUp({ value }) {
  const match = String(value).match(/^(\D*)(\d+)(.*)$/)
  const target = match ? Number(match[2]) : 0
  const ref = useRef(null)
  const [n, setN] = useState(match ? 0 : null)

  useEffect(() => {
    if (!match) return
    if (reducedMotion()) { setN(target); return }
    let raf
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = now => {
        const p = Math.min(1, (now - start) / 1400)
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(ref.current)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return <span>{value}</span>
  return <span ref={ref}>{match[1]}{n}{match[3]}</span>
}

// Subtle 3D tilt plus a cursor-following glow (uses --mx/--my in CSS). Mouse only.
export function tiltHandlers(strength = 5) {
  return {
    onPointerMove(e) {
      if (e.pointerType !== 'mouse' || reducedMotion()) return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${x * 100}%`)
      el.style.setProperty('--my', `${y * 100}%`)
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * strength}deg) rotateY(${(x - 0.5) * strength}deg) translateY(-4px)`
    },
    onPointerLeave(e) {
      e.currentTarget.style.transform = ''
    },
  }
}
