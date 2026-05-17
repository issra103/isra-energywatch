import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Zap, ArrowRight, Mail, Lock } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const panelRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Erreur lors de l\'inscription.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch {
      setError('Erreur de communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grain" />

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
              Inscrivez-vous et pilotez
              <br /> votre consommation énergétique
            </h2>
            <p className="login-left-sub">
              Créez un compte utilisateur et accédez à vos rapports, prévisions
              et alertes en un seul endroit.
            </p>
          </div>
        </div>
      </div>

      <div className="login-right" ref={panelRef}>
        <div className="login-form-wrap" ref={formRef}>
          <div className="login-form-header">
            <h1 className="login-form-title">Inscription</h1>
            <p className="login-form-sub">
              Ouvrez un compte pour accéder au tableau de bord EnergyWatch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Nom complet</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="login-input"
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="login-label">Mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="login-loader" />
              ) : (
                <>Créer mon compte <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="login-footer-text">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="login-link">Connectez-vous</Link>
          </div>
        </div>

        <div className="login-bottom-note">
          Projet PFE — ISRA 2025
        </div>
      </div>
    </div>
  );
}
