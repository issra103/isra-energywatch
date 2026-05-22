import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Zap, Activity, ShieldAlert, TrendingUp,
  BarChart2, Cpu, ArrowRight, ChevronDown,
  Wifi, Database, Lock
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { Icon: Activity,    title: 'Flux en Direct',        desc: 'Surveillance temps réel de la consommation énergétique avec des capteurs IoT haute précision.' },
  { Icon: ShieldAlert, title: 'Détection d\'Anomalies', desc: 'Intelligence artificielle pour identifier les comportements anormaux et prévenir les pannes.' },
  { Icon: TrendingUp,  title: 'Prévisions IA',         desc: 'Modèles prédictifs avancés pour anticiper la demande énergétique future.' },
  { Icon: BarChart2,   title: 'Rapports Détaillés',    desc: 'Tableaux de bord interactifs et rapports exportables pour une analyse approfondie.' },
  { Icon: Cpu,         title: 'IoT Intelligent',       desc: 'Réseau de capteurs connectés avec traitement edge computing en temps réel.' },
  { Icon: Zap,         title: 'Optimisation',          desc: 'Recommandations automatiques pour réduire les coûts et l\'empreinte carbone.' },
];

const STEPS = [
  { num: '01', Icon: Wifi,     title: 'Connectez',  desc: 'Branchez vos capteurs IoT au réseau Energy SaaS en quelques minutes.' },
  { num: '02', Icon: Database,  title: 'Collectez',  desc: 'Les données affluent en temps réel vers votre tableau de bord intelligent.' },
  { num: '03', Icon: TrendingUp, title: 'Analysez', desc: 'L\'IA détecte les anomalies et prédit la consommation future.' },
  { num: '04', Icon: Lock,      title: 'Optimisez',  desc: 'Appliquez les recommandations et réduisez vos coûts énergétiques.' },
];

const MARQUEE_ITEMS = [
  'IoT Monitoring', 'Machine Learning', 'Edge Computing', 'Smart Grid',
  'Prédiction IA', 'Anomaly Detection', 'Real-time Analytics', 'Green Energy',
  'Carbon Footprint', 'SCADA Integration',
];

function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
  const [display, setDisplay] = useState(prefix + '0' + suffix);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: numericPart,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            const v = Number.isInteger(numericPart)
              ? Math.round(obj.val)
              : obj.val.toFixed(1);
            setDisplay(prefix + v + suffix);
          },
        });
      },
    });
    return () => st.kill();
  }, [numericPart, prefix, suffix]);

  return <span ref={ref}>{display}</span>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const navRef = useRef(null);
  const heroTextRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const videoWrapRef = useRef(null);
  const midTextRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!heroTextRef.current) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    gsap.to(heroTextRef.current, {
      x: dx * 12, y: dy * 8,
      duration: 0.6, ease: 'power2.out',
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -30, opacity: 0, duration: 0.8,
        ease: 'power3.out', delay: 0.2,
      });

      gsap.from(heroTextRef.current.children, {
        y: 50, opacity: 0, duration: 0.9,
        stagger: 0.12, ease: 'power3.out', delay: 0.4,
      });

      gsap.to(scrollIndicatorRef.current, {
        y: 8, repeat: -1, yoyo: true,
        duration: 1.2, ease: 'power1.inOut',
      });

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top-=80',
        onEnter: () => setNavSolid(true),
        onLeaveBack: () => setNavSolid(false),
      });

      gsap.to(heroTextRef.current, {
        opacity: 0, y: -60, scale: 0.97,
        scrollTrigger: {
          trigger: heroTextRef.current,
          start: 'top top+=100',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to(scrollIndicatorRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: heroTextRef.current,
          start: 'top top+=50',
          end: 'top top-=100',
          scrub: 1,
        },
      });

      gsap.to(videoWrapRef.current, {
        borderRadius: '0rem', scale: 1,
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=80%',
          scrub: 1,
        },
      });

      const midChildren = midTextRef.current.children;
      gsap.fromTo(midChildren,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, stagger: 0.2,
          scrollTrigger: {
            trigger: midTextRef.current,
            start: 'top 75%', end: 'top 30%', scrub: 1,
          },
        }
      );
      gsap.to(midChildren, {
        opacity: 0, y: -30,
        scrollTrigger: {
          trigger: midTextRef.current,
          start: 'bottom 60%', end: 'bottom 20%', scrub: 1,
        },
      });

      gsap.from('.feature-card', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
        y: 50, opacity: 0, duration: 0.6,
        stagger: 0.08, ease: 'power3.out',
      });

      gsap.from('.step-card', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        y: 40, opacity: 0, duration: 0.6,
        stagger: 0.12, ease: 'power3.out',
      });

      gsap.from('.stat-item', {
        scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
        y: 35, opacity: 0, duration: 0.5,
        stagger: 0.1, ease: 'power3.out',
      });

      gsap.from(ctaRef.current, {
        scrollTrigger: { trigger: ctaRef.current, start: 'top 85%' },
        y: 40, opacity: 0, duration: 0.7, ease: 'power3.out',
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hp-root" ref={rootRef}>
      <div className="hp-grain" />

      <div ref={videoWrapRef} className="hp-video-fixed">
        <video
          src="/13509218_3840_2160_60fps.mp4"
          autoPlay muted loop playsInline
          className="hp-video"
        />
        <div className="hp-video-overlay" />
      </div>

      <nav ref={navRef} className={`hp-nav${navSolid ? ' hp-nav-solid' : ''}`}>
        <div className="hp-nav-inner">
          <div className="hp-nav-brand">
            <div className="hp-nav-icon">
              <Zap size={16} color="#0a0a0a" />
            </div>
            <span className="hp-nav-title">Energy SaaS</span>
          </div>
          <div className="hp-nav-links">
            <a href="#features">Fonctionnalités</a>
            <a href="#how">Comment ça marche</a>
            <a href="#stats">Performance</a>
          </div>
          <button className="btn-hp" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      </nav>

      <div className="hp-scroll-content">
        <section className="hp-hero">
          <div ref={heroTextRef} className="hp-hero-text">
            <div className="hp-hero-badge">
              <Zap size={12} /> Plateforme IoT Intelligente
            </div>
            <h1 className="hp-hero-h1">
              Surveillez votre
              <br />
              <span className="hp-text-dim">énergie en temps réel</span>
            </h1>
            <p className="hp-hero-sub">
              Energy SaaS combine l'Internet des Objets et l'Intelligence Artificielle
              pour révolutionner la gestion énergétique.
            </p>
            <div className="hp-hero-actions">
              <button className="btn-hp-primary" onClick={() => navigate('/login')}>
                Commencer <ArrowRight size={15} />
              </button>
              <button className="btn-hp-ghost" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                Découvrir
              </button>
            </div>
          </div>
          <div ref={scrollIndicatorRef} className="hp-scroll-indicator">
            <ChevronDown size={20} />
            <span>Scroll</span>
          </div>
        </section>

        <section className="hp-mid-text" ref={midTextRef}>
          <span className="hp-vo-tag">Énergie Renouvelable</span>
          <h2 className="hp-mid-title">L'avenir est propre</h2>
          <p className="hp-mid-sub">
            Des éoliennes aux panneaux solaires — surveillez chaque watt
            produit et consommé à travers votre réseau intelligent.
          </p>
        </section>

        <div className="hp-video-spacer" />

        <div className="hp-dark-content">
          {/* Marquee */}
          <div className="hp-marquee-wrap">
            <div className="hp-marquee">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
                <span key={i} className="hp-marquee-item">{t}</span>
              ))}
            </div>
          </div>

          <section id="features" ref={featuresRef} className="hp-features">
            <div className="hp-section-header">
              <span className="hp-section-tag">Fonctionnalités</span>
              <h2 className="hp-section-title">Tout ce dont vous avez besoin</h2>
              <p className="hp-section-sub">
                Une suite complète d'outils pour la surveillance et l'optimisation énergétique
              </p>
            </div>
            <div className="hp-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon">
                    <f.Icon size={20} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="how" ref={stepsRef} className="hp-steps">
            <div className="hp-section-header">
              <span className="hp-section-tag">Processus</span>
              <h2 className="hp-section-title">Comment ça marche</h2>
              <p className="hp-section-sub">
                De l'installation à l'optimisation, en quatre étapes simples
              </p>
            </div>
            <div className="hp-steps-grid">
              {STEPS.map((s, i) => (
                <div key={i} className="step-card">
                  <div className="step-num">{s.num}</div>
                  <div className="step-icon-wrap">
                    <s.Icon size={22} />
                  </div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                  {i < STEPS.length - 1 && <div className="step-connector" />}
                </div>
              ))}
            </div>
          </section>

          <section id="stats" ref={statsRef} className="hp-stats">
            <div className="hp-stats-grid">
              <div className="stat-item">
                <div className="stat-value"><AnimatedCounter value="99.9" suffix="%" /></div>
                <div className="stat-label">Disponibilité</div>
              </div>
              <div className="stat-item">
                <div className="stat-value"><AnimatedCounter value="50" prefix="<" suffix="ms" /></div>
                <div className="stat-label">Latence IoT</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Surveillance</div>
              </div>
              <div className="stat-item">
                <div className="stat-value"><AnimatedCounter value="40" suffix="%" /></div>
                <div className="stat-label">Économies</div>
              </div>
            </div>
          </section>

          <section id="cta" ref={ctaRef} className="hp-cta">
            <div className="hp-cta-inner">
              <h2 className="hp-cta-title">
                Prêt à optimiser votre consommation énergétique ?
              </h2>
              <p className="hp-cta-sub">
                Accédez au tableau de bord et commencez à surveiller vos installations en temps réel.
              </p>
              <button className="btn-hp-primary" onClick={() => navigate('/login')}>
                Commencer maintenant <ArrowRight size={15} />
              </button>
            </div>
          </section>

          <footer className="hp-footer">
            <div className="holo-line" />
            <div className="hp-footer-inner">
              <div className="hp-footer-brand">
                <Zap size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span>Energy SaaS</span>
              </div>
              <div className="hp-footer-copy">Projet PFE — ISRA 2025</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
