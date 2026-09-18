import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = window.location.hostname === 'localhost'
  ? 'http://portfolio-database.test/api'
  : 'https://hadi-portfolio-api.gamerhadi44.workers.dev/api'

const translations = {
  en: {
    navServices: 'Services',
    navWork: 'Work',
    navAbout: 'About',
    navContact: 'Contact',
    navCta: 'Start a project',
    eyebrow: 'WELCOME TO MY PORTFOLIO',
    role1: 'FULL-STACK DEVELOPER',
    role2: 'Flutter engineer . Video editor',
    desc: 'I design and build the whole thing - the backend, the app, the reel that shows it off, turning ideas into interactive reality.',
    cta: 'EXPLORE MY WORK',
    follow: 'FOLLOW ME',
    scrollLabel: 'SCROLL TO BREAK THROUGH',
    nextSection: '01 / ABOUT ME',
    aboutTag: '01 — ABOUT ME',
    aboutLede: 'Building things that feel as good as they work.',
    aboutP1: "I'm Hadi, a <strong>developer</strong> who also <strong>edits video</strong>, which turns out to be a useful combination. Most portfolios pick <strong>one skill</strong> and lean on it — mine is built from <strong>three</strong>, because that's genuinely how I work.",
    aboutP2: 'Day to day that means shipping full-stack web apps end to end, building Flutter apps that feel native on both platforms, and editing the launch videos, demo reels, and social cuts that get the work in front of people.',
    stat1Num: '3+', stat1Lbl: 'Years building products',
    stat2Num: '20+', stat2Lbl: 'Projects shipped',
    stat3Num: '3', stat3Lbl: 'Disciplines, one workflow',
    servicesTag: '02 — What I do',
    servicesH2: 'Three skills, one person to call.',
    servicesP: 'Pick the piece you need, or hand over the whole project — planning, build, and the video that explains it.',
    svc1Name: 'Full-stack development',
    svc1Desc: 'Web applications built end to end — databases, APIs, and the interface people actually touch. I favor simple, fast, maintainable systems over clever ones.',
    svc2Name: 'Flutter app development',
    svc2Desc: 'One codebase, native feel on iOS and Android. From first wireframe to an app-store-ready build, with animation and state handled properly rather than bolted on.',
    svc3Name: 'Video editing',
    svc3Desc: 'Product demos, launch trailers, and social cuts. I edit the way I code — with a clear structure first, then polish on top of it.',
    workTag: '03 — Selected work',
    workH2: 'A few things I\'ve shipped.',
    workP: 'Let me know what you think — Click to see the full work.',
    viewCase: 'View case study',
    watchReel: 'Watch reel',
    processTag: '04 — How a project runs',
    processH2: 'Three stages, no surprises.',
    process1Title: 'Scope it together',
    process1Desc: 'A short call to pin down what you actually need, a rough timeline, and a fixed quote — before any code is written.',
    process2Title: 'Build in the open',
    process2Desc: 'Regular check-ins with working previews, not silence until a big reveal. You see progress every week.',
    process3Title: 'Ship and hand off',
    process3Desc: "Deployed, documented, and — if it's a launch — cut into a video that explains it to your users or investors.",
    contactTag: '05 — Get in touch',
    contactH2: "Have a project in mind? Let's talk about it.",
    contactNote: 'Available All The Time, Just Let Me Know What You Need.',
footerCopy: '\u00a9 2026 Hadi Korish',
    footerThanks: 'Thanks For Your Visit',
  },
  ar: {
    navServices: 'الخدمات',
    navWork: 'الأعمال',
    navAbout: 'عني',
    navContact: 'تواصل',
    navCta: 'ابدأ مشروع',
    eyebrow: 'مرحباً بكم في محفظتي',
    role1: 'مطور Full-Stack',
    role2: 'مهندس Flutter . محرر فيديو',
    desc: 'أصمم وأبني كل شيء - الخلفية، التطبيق، والفيديو الذي يُظهره، أحول الأفكار إلى واقع تفاعلي.',
    cta: 'استكشف أعمالي',
    follow: 'تابعني',
    scrollLabel: 'مرر للأسفل للكسر',
    nextSection: '01 / عني',
    aboutTag: '01 — عني',
    aboutLede: 'أبني أشياء تشعر بالرائع كما تعمل.',
    aboutP1: 'أنا هادي، <strong>مطور</strong> أيضاً <strong>محرر فيديو</strong>، وهي مزيج مفيد. معظم المحافظ تختار <strong>مهارة واحدة</strong> وتعتمد عليها — محفظتي مبنية من <strong>ثلاث</strong>، لأنها الطريقة التي أعمل بها فعلاً.',
    aboutP2: 'يومياً يعني ذلك إطلاق تطبيقات ويب متكاملة، وبناء تطبيقات Flutter تشعر بأصلية على كلا المنصتين، وتحرير فيديوهات الإطلاق والعروض الرسومية والقصات الاجتماعية.',
    stat1Num: '3+', stat1Lbl: 'سنوات بناء المنتجات',
    stat2Num: '20+', stat2Lbl: 'مشاريع تم إطلاقها',
    stat3Num: '3', stat3Lbl: 'تخصصات، سير عمل واحد',
    servicesTag: '02 — ما أفعله',
    servicesH2: 'ثلاث مهارات، شخص واحد للتواصل معه.',
    servicesP: 'اختر القطعة التي تحتاجها، أو سلّم المشروع بالكامل — التخطيط، البناء، والفيديو الذي يشرحه.',
    svc1Name: 'تطوير Full-Stack',
    svc1Desc: 'تطبيقات ويب مبنية من البداية للنهاية — قواعد البيانات، APIs، والواجهة التي يلمسها الناس. أفضل الأنظمة البسيطة والسريعة وسهلة الصيانة.',
    svc2Name: 'تطوير تطبيقات Flutter',
    svc2Desc: 'قاعدة كود واحدة، إحساس أصلي على iOS و Android. من أول تصميم إلى بناء جاهز لمتجر التطبيقات.',
    svc3Name: 'تحرير الفيديو',
    svc3Desc: 'عرض المنتجات، مقاطع الإطلاق، والقصات الاجتماعية. أحرر بنفس الطريقة التي أكتب بها الكود.',
    workTag: '03 — أعمال مختارة',
    workH2: 'بضعة أشياء أطلقتها.',
    workP: 'أخبرني برأيك — اضغط لرؤية العمل الكامل.',
    viewCase: 'عرض دراسة الحالة',
    watchReel: 'مشاهدة العرض',
    processTag: '04 — كيف يسير المشروع',
    processH2: 'ثلاث مراحل، بدون مفاجآت.',
    process1Title: 'نحدد النطاق معاً',
    process1Desc: 'مكالمة قصيرة لتحديد ما تحتاجه فعلاً، جدول زمني تقريبي، وثابت السعر — قبل كتابة أي كود.',
    process2Title: 'نبني بشفافية',
    process2Desc: 'اجتماعات منتظمة مع معاينات عملية، لا صمت حتى الكشف الكبير. ترى التقدم كل أسبوع.',
    process3Title: 'نُطلق ونسلّم',
    process3Desc: 'تم النشر والتوثيق، وإذا كان إطلاقاً — نُقطع فيديو يشرحه لمستخدميك أو مستثمريك.',
    contactTag: '05 — تواصل معي',
    contactH2: 'هل لديك مشروع في ذهنك؟ لنتحدث عنه.',
    contactNote: 'متاح في كل الأوقات، فقط أخبرني بما تحتاجه.',
    footerCopy: '\u00a9 2026 هادي قريش',
    footerThanks: 'شكراً لزيارتك',
  },
}

const typeLabels = {
  web_app: { en: 'Web App', ar: 'تطبيق ويب' },
  video_production_reel: { en: 'Video production reel', ar: 'فيديو إنتاجي' },
  mobile_flutter: { en: 'Mobile · Flutter', ar: 'محمول · Flutter' },
}

const typeGradients = {
  web_app: 'linear-gradient(135deg,#3a2c66,#7c6fd1)',
  video_production_reel: 'linear-gradient(135deg,#5c2b3f,#d97a9c)',
  mobile_flutter: 'linear-gradient(135deg,#243d5c,#4a7bab)',
}

function getInitialLang() {
  const saved = localStorage.getItem('lang')
  if (saved) return saved
  const browserLang = navigator.language || navigator.userLanguage || ''
  return browserLang.startsWith('ar') ? 'ar' : 'en'
}

function App() {
  const [projects, setProjects] = useState([])
  const [lang, setLang] = useState(getInitialLang)
  const navRef = useRef(null)
  const stageRef = useRef(null)
  const copyRef = useRef(null)
  const frameRef = useRef(null)
  const portraitRef = useRef(null)
  const nextRef = useRef(null)
  const progressRef = useRef(null)
  const firstRef = useRef(null)
  const lastRef = useRef(null)
  const shardsContainerRef = useRef(null)

  const t = translations[lang]

  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const nav = navRef.current;
    const stage = stageRef.current;
    const copy = copyRef.current;
    const frame = frameRef.current;
    const portrait = portraitRef.current;
    const next = nextRef.current;
    const progress = progressRef.current;
    const first = firstRef.current;
    const last = lastRef.current;
    const shards = shardsContainerRef.current
      ? [...shardsContainerRef.current.querySelectorAll('.shard')]
      : [];

    if (!nav || !stage || !copy || !frame || !portrait || !next || !progress || !first || !last) {
      return;
    }

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    let renderRafId, smoothMouseRafId;

    function handleScroll() {
      const rect = stage.getBoundingClientRect();
      const total = Math.max(1, stage.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / total));
      nav.classList.toggle('scrolled', p > 0.74);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    function handlePointerMove(e) {
      mouseX = (e.clientX / window.innerWidth - .5) * 2;
      mouseY = (e.clientY / window.innerHeight - .5) * 2;
    }
    window.addEventListener('pointermove', handlePointerMove);

    const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const range = (p, a, b) => clamp((p - a) / (b - a));

    function render() {
      const rect = stage.getBoundingClientRect();
      const total = stage.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total);

      progress.style.transform = `scaleX(${p})`;

      const intro = ease(range(p, 0, .18));
      const breakIn = ease(range(p, .14, .34));
      const burst = ease(range(p, .28, .55));
      const exit = ease(range(p, .54, .78));
      const finish = ease(range(p, .76, 1));

      const textShift = breakIn * 160;
      const textScale = 1 - burst * .12 - exit * .18;
      const textOpacity = 1 - exit * .95;

      copy.style.transform =
        `translate3d(${-textShift}px, ${-exit * 80}px, ${exit * 180}px) scale(${textScale})`;
      copy.style.opacity = textOpacity;

      first.style.transform = `translateX(${-burst * 120}px)`;
      last.style.transform = `translateX(${burst * 130}px)`;

      const z = -60 + burst * 480 - exit * 120;
      const x = -burst * 40 + exit * 120;
      const y = intro * 10 - exit * 190;
      const rotY = -4 + burst * 7 + exit * 16;
      const rotX = burst * 2 - exit * 8;
      const scale = .83 + burst * .22 + exit * .25;

      targetX = mouseX * 3.5;
      targetY = mouseY * 2.2;
      portrait.style.transform =
        `translate3d(${x + targetX}px, ${y + targetY}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`;
      portrait.style.opacity = 1 - finish * .88;

      const frameX = -burst * 40 + exit * 210;
      const frameY = burst * 15 - exit * 60;
      const frameRotY = burst * 8 + exit * 48;
      const frameRotX = burst * 2 + exit * 18;
      const frameScale = 1 + exit * .18;
      frame.style.transform =
        `translate3d(${frameX}px, ${frameY}px, ${-burst * 20}px) rotateY(${frameRotY}deg) rotateX(${frameRotX}deg) scale(${frameScale})`;
      frame.style.opacity = 1 - burst * .92;

      shards.forEach((s, i) => {
        const delay = i * .018;
        const local = clamp((burst - delay) / .7);
        s.style.setProperty('--burst', ease(local));
      });

      next.style.opacity = clamp((p - .64) / .18);
      next.style.transform = `translateY(${30 * (1 - clamp((p - .64) / .18))}px)`;

      renderRafId = requestAnimationFrame(render);
    }
    render();

    function smoothMouse() {
      targetX += (mouseX * 3.5 - targetX) * .035;
      targetY += (mouseY * 2.2 - targetY) * .035;
      smoothMouseRafId = requestAnimationFrame(smoothMouse);
    }
    smoothMouse();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(renderRafId);
      cancelAnimationFrame(smoothMouseRafId);
    };
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/projects/public`)
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load projects:', err))
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('tracked')) return
    sessionStorage.setItem('tracked', '1')
    fetch(`${API_URL}/track-visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.location.href,
        referrer: document.referrer,
      }),
    }).catch(() => {})
  }, [])

  return (
    <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Sora:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="progress" id="progress" ref={progressRef}></div>

      <nav className="nav" id="siteNav" ref={navRef}>
        <a href="#top" className="nav-name">Hadi Korish</a>
        <div className="nav-links">
          <a href="#services">{t.navServices}</a>
          <a href="#work">{t.navWork}</a>
          <a href="#about">{t.navAbout}</a>
          <a href="#contact">{t.navContact}</a>
        </div>
        <div className="nav-right">
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <a href="#contact" className="nav-cta">{t.navCta}</a>
        </div>
      </nav>

      <section className="scroll-stage" id="stage" ref={stageRef}>
        <div className="sticky" id="sticky">
          <div className="grid"></div>
          <div className="noise"></div>

          <div className="copy" id="copy" ref={copyRef}>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1><span id="firstName" ref={firstRef}>HADI</span><span className="last" id="lastName" ref={lastRef}>KORISH</span></h1>
            <div className="role">{t.role1}
              <br />{t.role2}</div>
            <p className="desc">{t.desc}</p>
            <a className="cta" href="#work">{t.cta} <b>→</b></a>
          </div>

          <div className="screen-frame" id="frame" ref={frameRef}>
            <div className="glass"></div>
          </div>

          <div className="portrait-wrap" id="portraitWrap" ref={portraitRef}>
            <img className="portrait" src={`${import.meta.env.BASE_URL}Me.png`} alt="Portrait of Hadi Korish" />
          </div>

          <div className="shards" id="shards" ref={shardsContainerRef}>
            <i className="shard" style={{ '--w': '90px', '--h': '160px', '--x': '64%', '--y': '20%', '--tx': '90px', '--ty': '-120px', '--tz': '260px', '--r': '30deg' }}></i>
            <i className="shard" style={{ '--w': '120px', '--h': '70px', '--x': '70%', '--y': '33%', '--tx': '170px', '--ty': '-25px', '--tz': '220px', '--r': '-22deg' }}></i>
            <i className="shard" style={{ '--w': '75px', '--h': '110px', '--x': '58%', '--y': '46%', '--tx': '-130px', '--ty': '50px', '--tz': '190px', '--r': '-40deg' }}></i>
            <i className="shard" style={{ '--w': '140px', '--h': '80px', '--x': '76%', '--y': '52%', '--tx': '180px', '--ty': '120px', '--tz': '240px', '--r': '45deg' }}></i>
            <i className="shard" style={{ '--w': '60px', '--h': '130px', '--x': '66%', '--y': '66%', '--tx': '-110px', '--ty': '160px', '--tz': '200px', '--r': '65deg' }}></i>
            <i className="shard" style={{ '--w': '95px', '--h': '65px', '--x': '82%', '--y': '25%', '--tx': '210px', '--ty': '-100px', '--tz': '180px', '--r': '-55deg' }}></i>
            <i className="shard" style={{ '--w': '45px', '--h': '90px', '--x': '54%', '--y': '58%', '--tx': '-170px', '--ty': '110px', '--tz': '160px', '--r': '20deg' }}></i>
            <i className="shard" style={{ '--w': '80px', '--h': '45px', '--x': '74%', '--y': '72%', '--tx': '150px', '--ty': '190px', '--tz': '210px', '--r': '-30deg' }}></i>
          </div>

          <div className="micro follow">{t.follow}</div>
          <div className="scroll-label">{t.scrollLabel}<div className="scroll-line"></div></div>
          <div className="next-section" id="next" ref={nextRef}>{t.nextSection}</div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="tag">{t.aboutTag}</div>
        <div className="container intro-grid">
          <p className="intro-lede">{t.aboutLede}</p>
          <div className="intro-body">
            <p dangerouslySetInnerHTML={{ __html: t.aboutP1 }}></p>
            <p>{t.aboutP2}</p>
            <div className="stat-row">
              <div className="stat"><div className="num">{t.stat1Num}</div><div className="lbl">{t.stat1Lbl}</div></div>
              <div className="stat"><div className="num">{t.stat2Num}</div><div className="lbl">{t.stat2Lbl}</div></div>
              <div className="stat"><div className="num">{t.stat3Num}</div><div className="lbl">{t.stat3Lbl}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad" id="services">
        <div className="container">
          <div className="tag2">{t.servicesTag}</div>
          <div className="section-head">
            <h2>{t.servicesH2}</h2>
            <p>{t.servicesP}</p>
          </div>
          <div className="services-list">
            <div className="service-row">
              <div className="service-name"><span className="swatch" style={{ background: 'var(--accent)' }}></span>{t.svc1Name}</div>
              <div className="service-desc">
                <p>{t.svc1Desc}</p>
                <div className="chip-row">
                  <span className="chip">React / Next.js</span>
                  <span className="chip">Laravel / Filament</span>
                  <span className="chip">MySql</span>
                  <span className="chip">REST &amp; GraphQL APIs</span>
                </div>
              </div>
            </div>
            <div className="service-row">
              <div className="service-name"><span className="swatch" style={{ background: 'var(--accent-2)' }}></span>{t.svc2Name}</div>
              <div className="service-desc">
                <p>{t.svc2Desc}</p>
                <div className="chip-row">
                  <span className="chip">Flutter / Dart</span>
                  <span className="chip">Firebase</span>
                  <span className="chip">State management</span>
                  <span className="chip">App Store &amp; Play Store release</span>
                </div>
              </div>
            </div>
            <div className="service-row">
              <div className="service-name"><span className="swatch" style={{ background: '#d97a9c' }}></span>{t.svc3Name}</div>
              <div className="service-desc">
                <p>{t.svc3Desc}</p>
                <div className="chip-row">
                  <span className="chip">Premiere Pro</span>
                  <span className="chip">After Effects</span>
                  <span className="chip">CapCut</span>
                  <span className="chip">Motion graphics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="work section-pad" id="work">
        <div className="container">
          <div className="tag2">{t.workTag}</div>
          <div className="section-head">
            <h2>{t.workH2}</h2>
            <p>{t.workP}</p>
          </div>
          <div className="work-grid">
            {projects.map((project) => (
              <div className="work-card" key={project.id}>
                <div className="work-thumb" style={{ background: typeGradients[project.type] || typeGradients.web_app }}>
                  <img
                    src={window.location.hostname === 'localhost'
                      ? `http://portfolio-database.test/storage/${project.photo}`
                      : (project.photo && project.photo.startsWith('http') ? project.photo : `/storage/${project.photo}`)}
                    alt={project.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="work-body">
                  <div className="work-tag">{typeLabels[project.type]?.[lang] || project.type}</div>
                  <div className="work-title">{project.name}</div>
                  <p className="work-desc">{project.description}</p>
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="work-link">
                    {project.type === 'video_production_reel' ? t.watchReel : t.viewCase}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="tag2">{t.processTag}</div>
          <div className="section-head">
            <h2>{t.processH2}</h2>
          </div>
          <div className="process-grid">
            <div className="process-step">
              <div className="process-card">
                <div className="step-num">01</div>
                <h3>{t.process1Title}</h3>
                <p>{t.process1Desc}</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-card">
                <div className="step-num">02</div>
                <h3>{t.process2Title}</h3>
                <p>{t.process2Desc}</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-card">
                <div className="step-num">03</div>
                <h3>{t.process3Title}</h3>
                <p>{t.process3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="container contact-inner">
          <div className="tag2" style={{ justifyContent: 'center' }}>{t.contactTag}</div>
          <h2>{t.contactH2}</h2>
          <a href="mailto:hadimc24@gmail.com?subject=Project%20inquiry" className="contact-email">hadimc24@gmail.com</a>
          <p className="contact-note">{t.contactNote}</p>
          <div className="socials">
            <a target="_blank" href="https://wa.me/+963998548611">Whatsapp</a>
            <a target="_blank" href="https://www.instagram.com/hadik.motion?stkn=MTNqdHoxZDVxY2huZA%3D%3D&utm_source=qr">Instagram</a>
            <a target="_blank" href="https://www.linkedin.com/in/hadi-korish-838a75430">LinkedIn</a>
            <a target="_blank" href="https://github.com/Hitman47q">GitHub</a>
            {/* <a target="_blank" href="https://facebook.com/hadi.korish">Facebook</a> */}
          </div>
        </div>
        <div className="container foot">
          <span>{t.footerCopy}</span>
          <span>{t.footerThanks}</span>
        </div>
      </section>
    </>
  )
}

export default App
