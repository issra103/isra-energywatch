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
            <h1 className="login-form-title">Connexion</h1>
            <p className="login-form-sub">
              Entrez vos identifiants pour accéder au tableau de bord
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
                <a href="#" className="login-forgot">Mot de passe oublié ?</a>
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
            Pas encore de compte ?{' '}
            <Link to="/register" className="login-link">Créez un compte</Link>
          </div>
        </div>

        <div className="login-bottom-note">
          Projet PFE — ISRA 2025
        </div>
      </div>
    </div>
  );
}
