import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Zap, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const panelRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(panelRef.current, {
        opacity: 0, x: 40, duration: 0.8,
        ease: 'power3.out', delay: 0.1,
      });
      gsap.from(formRef.current.children, {
        opacity: 0, y: 20, duration: 0.6,
        stagger: 0.08, ease: 'power3.out', delay: 0.3,
      });
    });
    return () => ctx.revert();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Identifiants incorrects.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grain" />

      {/* Left — branding + video bg */}
      <div className="login-left">
        <video
          src="/13509218_3840_2160_60fps.mp4"
          autoPlay muted loop playsInline
          className="login-video"
        />
        <div className="login-video-overlay" />
        <div className="login-left-content">
          <Link to="/" className="login-logo">
            <div className="login-logo-icon">
              <Zap size={18} color="#0a0a0a" />
            </div>
            <span className="login-logo-text">EnergyWatch</span>
          </Link>
          <div className="login-left-bottom">
            <h2 className="login-left-title">
              Gérez votre énergie
              <br />
              intelligemment
            </h2>
            <p className="login-left-sub">
              Surveillance IoT en temps réel, détection d'anomalies par IA
              et optimisation automatique de votre consommation.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="login-right" ref={panelRef}>
        <div className="login-form-wrap" ref={formRef}>
          <div className="login-form-header">
            <div className="login-form-badge">
              <span className="login-form-badge-dot" />
              Système actif
            </div>
            <h1 className="login-form-title">Connexion</h1>
            <p className="login-form-sub">
              Accédez à votre tableau de bord énergétique
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label">Mot de passe</label>
                <a href="/forgot-password" className="login-forgot">Mot de passe oublié ?</a>
              </div>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-loader" />
              ) : (
                <>Se connecter <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="login-footer-text">
          </div>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="login-google-btn"
            onClick={() => {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
              window.location.href = `${apiUrl}/api/auth/google`;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Se connecter avec Google
          </button>
        </div>

        <div className="login-bottom-note">
          Projet PFE — ISRA 2025
        </div>
      </div>
    </div>
  );
}
