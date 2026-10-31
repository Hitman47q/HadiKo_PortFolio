import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterLabels, typeLabels } from '../i18n.js'
import { isVideoFile, mediaUrl } from '../lib/api.js'
import { tiltHandlers, useReveal } from './motion.jsx'

const typeGradients = {
  web_app: 'linear-gradient(135deg,#2b2140,#6d5fb8)',
  video_production_reel: 'linear-gradient(135deg,#40202d,#b8667f)',
  mobile_flutter: 'linear-gradient(135deg,#1c2e45,#3f6c97)',
}

const techList = tech => String(tech || '').split(',').map(s => s.trim()).filter(Boolean)

// Portrait screenshots (phone apps) go into a phone frame instead of being cropped to 16:10.
function Thumb({ project, playing }) {
  const [shape, setShape] = useState(null)
  const photo = mediaUrl(project.photo)
  const video = isVideoFile(project.video_url) ? mediaUrl(project.video_url) : ''
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (playing) v.play().catch(() => {})
    else { v.pause() }
  }, [playing])

  return (
    <div className={`work-thumb ${shape === 'tall' ? 'is-tall' : ''}`} style={{ background: typeGradients[project.type] || typeGradients.web_app }}>
      {photo && (
        <div className="thumb-media">
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={e => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget
              setShape(h > w * 1.1 ? 'tall' : 'wide')
              e.currentTarget.classList.add('is-loaded')
            }}
          />
        </div>
      )}
      {video && (
        <video ref={videoRef} className={`thumb-video ${playing ? 'is-playing' : ''}`} src={video} muted loop playsInline preload="none" />
      )}
      {project.type === 'video_production_reel' && <span className="play" aria-hidden="true" />}
    </div>
  )
}

function WorkCard({ project, t, lang, onOpen }) {
  const [hover, setHover] = useState(false)
  const tilt = tiltHandlers(3)
  return (
    <article
      className={`work-card ${project.featured ? 'is-featured' : ''}`}
      data-reveal
      onPointerEnter={() => setHover(true)}
      onPointerLeave={e => { setHover(false); tilt.onPointerLeave(e) }}
      onPointerMove={tilt.onPointerMove}
    >
      <button className="work-hit" onClick={() => onOpen(project)} aria-label={`${t.viewCase}: ${project.name}`} />
      <Thumb project={project} playing={hover} />
      <div className="work-body">
        <div className="work-meta">
          <span className="work-tag">{typeLabels[project.type]?.[lang] || project.type}</span>
          {!!project.featured && <span className="work-featured">{t.featured}</span>}
        </div>
        <h3 className="work-title">{project.name}</h3>
        <p className="work-desc">{project.description}</p>
        {techList(project.tech).length > 0 && (
          <div className="chip-row small">
            {techList(project.tech).slice(0, 4).map(c => <span className="chip" key={c}>{c}</span>)}
          </div>
        )}
        <span className="work-link">
          {project.type === 'video_production_reel' ? t.watchReel : t.viewCase} <b aria-hidden="true">→</b>
        </span>
      </div>
    </article>
  )
}

function CaseStudy({ project, t, lang, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    closeRef.current?.focus()
    document.body.classList.add('no-scroll')
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  const photo = mediaUrl(project.photo)
  const video = isVideoFile(project.video_url) ? mediaUrl(project.video_url) : ''
  const paragraphs = (project.details || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
  const tech = techList(project.tech)

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="case-title" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" ref={closeRef} onClick={onClose} aria-label={t.close}>×</button>
        <div className="modal-media" style={{ background: typeGradients[project.type] || typeGradients.web_app }}>
          {video
            ? <video src={video} poster={photo || undefined} controls playsInline />
            : photo && <img src={photo} alt={project.name} />}
        </div>
        <div className="modal-body">
          <div className="work-tag">{typeLabels[project.type]?.[lang] || project.type}</div>
          <h3 id="case-title">{project.name}</h3>
          <p className="modal-lede">{project.description}</p>
          {paragraphs.length > 0 && (
            <>
              <div className="modal-label">{t.overview}</div>
              {paragraphs.map((p, i) => <p key={i} className="modal-text">{p}</p>)}
            </>
          )}
          {tech.length > 0 && (
            <>
              <div className="modal-label">{t.builtWith}</div>
              <div className="chip-row">{tech.map(c => <span className="chip" key={c}>{c}</span>)}</div>
            </>
          )}
          {project.link && (
            <a className="btn btn-primary" href={project.link} target="_blank" rel="noopener noreferrer">
              {project.type === 'video_production_reel' ? t.watchReel : t.openProject} <b aria-hidden="true">↗</b>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Work({ t, lang, projects, status }) {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)

  const types = useMemo(
    () => Object.keys(filterLabels).filter(type => projects.some(p => p.type === type)),
    [projects],
  )
  const shown = filter === 'all' ? projects : projects.filter(p => p.type === filter)
  const close = useCallback(() => setOpen(null), [])
  useReveal([shown, status])

  return (
    <section className="work section-pad" id="work">
      <div className="container">
        <div className="tag2" data-reveal>{t.workTag}</div>
        <div className="section-head" data-reveal>
          <h2>{t.workH2}</h2>
          <p>{t.workP}</p>
        </div>

        {types.length > 1 && (
          <div className="filters" role="tablist" data-reveal>
            {['all', ...types].map(type => (
              <button
                key={type}
                role="tab"
                aria-selected={filter === type}
                className={`filter ${filter === type ? 'is-active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {type === 'all' ? t.filterAll : filterLabels[type][lang]}
                <span>{type === 'all' ? projects.length : projects.filter(p => p.type === type).length}</span>
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && (
          <div className="work-grid">
            {[0, 1].map(i => <div key={i} className="work-card skeleton" aria-hidden="true" />)}
          </div>
        )}
        {status === 'error' && <p className="work-empty">{t.workError}</p>}
        {status === 'ready' && projects.length === 0 && <p className="work-empty">{t.workEmpty}</p>}
        {status === 'ready' && shown.length > 0 && (
          <div className="work-grid">
            {shown.map(p => <WorkCard key={p.id} project={p} t={t} lang={lang} onOpen={setOpen} />)}
          </div>
        )}
      </div>
      {open && <CaseStudy project={open} t={t} lang={lang} onClose={close} />}
    </section>
  )
}
