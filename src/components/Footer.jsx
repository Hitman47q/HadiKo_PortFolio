import { useEffect, useRef, useState } from 'react'
import profileImg from '../assets/profile.svg'
import './Footer.css'

function Footer() {
  const footerRef = useRef(null)
  const scrollTextRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('websites')

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current || !scrollTextRef.current) return
      const rect = footerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const scrollProgress = Math.max(0, Math.min(1, 1 - rect.top / windowHeight))

      const textEl = scrollTextRef.current
      const translateX = scrollProgress * -200
      const scale = 1 + scrollProgress * 0.3
      const opacity = 0.1 + scrollProgress * 0.9
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

  const projects = {
    websites: [
      { name: 'E-Commerce Platform', tech: 'React, Node.js' },
      { name: 'SaaS Dashboard', tech: 'Next.js, Tailwind' },
      { name: 'Portfolio Template', tech: 'React, Vite' },
    ],
    apps: [
      { name: 'Fitness Tracker', tech: 'Flutter, Firebase' },
      { name: 'Food Delivery', tech: 'Flutter, Dart' },
      { name: 'Social App', tech: 'Flutter, Supabase' },
    ],
    videos: [
      { name: 'Brand Commercial', tech: 'Premiere Pro' },
      { name: 'Product Launch', tech: 'After Effects' },
      { name: 'Music Video Edit', tech: 'DaVinci Resolve' },
    ],
  }

  return (
    <footer ref={footerRef} className="scroll-footer">
      <div className="scroll-text-container">
        <div ref={scrollTextRef} className="scroll-text">
          <span>HADI</span>
          <span className="scroll-text-outline">HADI</span>
          <span>HADI</span>
          <span className="scroll-text-outline">HADI</span>
        </div>
      </div>

      <div className="footer-glass-panel">
        <div className="footer-profile-section">
          <div className="profile-glass-ring">
            <img src={profileImg} alt="Hadi" className="profile-img" />
          </div>
          <div className="profile-info">
            <h2 className="profile-name">Hadi</h2>
            <p className="profile-role">Full Stack Developer &bull; Flutter App Design &bull; Video Editor</p>
          </div>
        </div>

        <div className="category-switcher">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`glass-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <svg viewBox="0 0 24 24" className="cat-icon">
                <path d={cat.icon} />
              </svg>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="projects-showcase">
          {projects[activeCategory].map((project, i) => (
            <div key={project.name} className="glass-project-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <h4>{project.name}</h4>
              <p>{project.tech}</p>
            </div>
          ))}
        </div>

        <div className="footer-contact">
          <a href="mailto:hadi@example.com" className="glass-contact-btn">
            <svg viewBox="0 0 24 24" className="contact-icon">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            Get In Touch
          </a>
          <div className="social-glass-links">
            <a href="#" className="glass-social" aria-label="GitHub">
              <svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            </a>
            <a href="#" className="glass-social" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <a href="#" className="glass-social" aria-label="Twitter">
              <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; 2026 Hadi &mdash; Crafted with passion</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
