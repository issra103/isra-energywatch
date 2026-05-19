import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Zap, ArrowRight, Eye, EyeOff, Mail, Lock, Key, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const panelRef = useRef(null);
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot password states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Code + New Pass
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
  }, [navigate, isForgotMode, resetStep]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Veuillez entrer votre email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur lors de l'envoi du code.");
        return;
      }
      setSuccess('Code envoyé ! Vérifiez votre boîte Gmail.');
      setResetStep(2);
    } catch {
      setError('Erreur de communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetCode || !newPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Code invalide ou expiré.');
        return;
      }
      setSuccess('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      setIsForgotMode(false);
      setResetStep(1);
      setPassword('');
    } catch {
      setError('Erreur de communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grain" />

      <div className="login-card">
        {/* Left — branding + cinematic image */}
        <div className="login-left">
          <img
            src="https://images.unsplash.com/photo-1466611653911-95282fc3656b?auto=format&fit=crop&w=1200&q=80"
            className="login-video"
            alt="Éoliennes"
            crossOrigin="anonymous"
          />
          <div className="login-video-overlay" />
          <div className="login-left-content">
            <Link to="/" className="login-logo">
              <div className="login-logo-icon">
                <Zap size={18} className="text-indigo-600 fill-indigo-600" />
              </div>
              <span className="login-logo-text">EnergyWatch — Surveillance IoT</span>
            </Link>
            <div className="login-left-bottom">
              <h2 className="login-left-title">
                {isForgotMode ? "Récupérez votre accès" : "Gérez votre énergie"}
                <br />
                {isForgotMode ? "en toute sécurité" : "intelligemment"}
              </h2>
              <p className="login-left-sub">
                {isForgotMode 
                  ? "Nous vous envoyons un code unique sur votre adresse Gmail pour réinitialiser votre mot de passe."
                  : "Surveillance IoT en temps réel, détection d'anomalies par IA et optimisation automatique de votre consommation."}
              </p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="login-right" ref={panelRef}>
          <div className="login-form-wrap" ref={formRef}>
            
            {/* LOGIN MODE */}
            {!isForgotMode && (
              <>
                <div className="login-form-header">
                  <h1 className="login-form-title">Connexion</h1>
                  <p className="login-form-sub">Accédez à votre espace de gestion énergétique</p>
                </div>

                {success && <div className="login-success-msg" style={{color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle2 size={16}/> {success}</div>}

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
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <div className="login-label-row">
                      <label className="login-label">Mot de passe</label>
                      <button 
                        type="button" 
                        onClick={() => {setIsForgotMode(true); setError(''); setSuccess('');}} 
                        className="login-forgot"
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="login-input-wrap">
                      <Lock size={16} className="login-input-icon" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                      />
                      <button type="button" className="login-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="login-error">{error}</div>}

                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? <span className="login-loader" /> : <>Se connecter <ArrowRight size={15} /></>}
                  </button>
                </form>

                <div className="login-footer-text">
                  Pas encore de compte ? <Link to="/register" className="login-link">Créez un compte</Link>
                </div>
              </>
            )}

            {/* FORGOT MODE - STEP 1: EMAIL */}
            {isForgotMode && resetStep === 1 && (
              <>
                <div className="login-form-header">
                  <h1 className="login-form-title">Récupération</h1>
                  <p className="login-form-sub">Entrez votre email pour recevoir un code</p>
                </div>

                <form onSubmit={handleForgotPassword} className="login-form">
                  <div className="login-field">
                    <label className="login-label">Email de récupération</label>
                    <div className="login-input-wrap">
                      <Mail size={16} className="login-input-icon" />
                      <input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                      />
                    </div>
                  </div>

                  {error && <div className="login-error">{error}</div>}

                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? <span className="login-loader" /> : <>Envoyer le code <ArrowRight size={15} /></>}
                  </button>

                  <button type="button" onClick={() => setIsForgotMode(false)} className="login-link" style={{textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer'}}>Retour à la connexion</button>
                </form>
              </>
            )}

            {/* FORGOT MODE - STEP 2: CODE + NEW PASS */}
            {isForgotMode && resetStep === 2 && (
              <>
                <div className="login-form-header">
                  <h1 className="login-form-title">Nouveau mot de passe</h1>
                  <p className="login-form-sub">Saisissez le code reçu par Gmail</p>
                </div>

                {success && <div className="login-success-msg" style={{color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle2 size={16}/> {success}</div>}

                <form onSubmit={handleResetPassword} className="login-form">
                  <div className="login-field">
                    <label className="login-label">Code de vérification (6 chiffres)</label>
                    <div className="login-input-wrap">
                      <Key size={16} className="login-input-icon" />
                      <input
                        type="text"
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="login-input"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <label className="login-label">Nouveau mot de passe</label>
                    <div className="login-input-wrap">
                      <Lock size={16} className="login-input-icon" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="login-input"
                      />
                    </div>
                  </div>

                  {error && <div className="login-error">{error}</div>}

                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? <span className="login-loader" /> : <>Changer le mot de passe <ArrowRight size={15} /></>}
                  </button>

                  <button type="button" onClick={() => setResetStep(1)} className="login-link" style={{textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer'}}>Renvoyer un code</button>
                </form>
              </>
            )}

          </div>

          <div className="login-bottom-note">
            Projet PFE — ISRA 2025
          </div>
        </div>
      </div>
    </div>
  );
}
