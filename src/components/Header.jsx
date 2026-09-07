import { useEffect, useRef, useState } from 'react'
import profileImg from '../assets/profile.svg'
import './Header.css'

function Header() {
  const heroRef = useRef(null)
  const scrollTextRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('websites')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)

      if (!heroRef.current || !scrollTextRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const scrollProgress = Math.max(0, Math.min(1, 1 - rect.top / windowHeight))

      const textEl = scrollTextRef.current
      const translateX = scrollProgress * -300
      const scale = 0.8 + scrollProgress * 0.5
      const opacity = 0.15 + scrollProgress * 0.85
      textEl.style.transform = `translateX(${translateX}px) scale(${scale})`
      textEl.style.opacity = opacity
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categories = [
    { id: 'websites', label: 'Websites', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
    { id: 'apps', label: 'Apps', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'videos', label: 'Videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  ]

  return (
    <header ref={heroRef} className="cinematic-header">
      {/* Navigation */}
      <nav className={`glass-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-profile-mini">
              <img src={profileImg} alt="Hadi" className="nav-profile-img" />
            </div>
            <span className="nav-name">Hadi</span>
          </div>

          <div className="nav-links">
            <a href="#work" className="nav-link">Work</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link nav-link-accent">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot" />
          Available for work
        </div>

        <div ref={scrollTextRef} className="hero-scroll-text">
          <span className="text-solid">HADI</span>
          <span className="text-outline">HADI</span>
          <span className="text-solid">HADI</span>
        </div>

        <p className="hero-tagline">
          Full Stack Developer &bull; Flutter App Design &bull; Video Editor
        </p>

        <div className="hero-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`hero-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <svg viewBox="0 0 24 24" className="hero-cat-icon">
                <path d={cat.icon} />
              </svg>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="hero-scroll-indicator">
          <div className="scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </div>
    </header>
  )
}

export default Header
