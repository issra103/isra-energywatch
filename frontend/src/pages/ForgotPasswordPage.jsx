import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Zap, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const formRef  = useRef(null);

  const [step, setStep]         = useState(1); // 1=email, 2=code+newpw
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPw, setNewPw]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(panelRef.current, { opacity: 0, x: 40, duration: 0.8, ease: 'power3.out' });
      gsap.from(formRef.current.children, { opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
    });
    return () => ctx.revert();
  }, [step]);

  // Étape 1 — Envoyer le code par email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Veuillez entrer votre email.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erreur.'); return; }
      setSuccess('Code envoyé ! Vérifiez votre email.');
      setTimeout(() => { setSuccess(''); setStep(2); }, 1500);
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 — Réinitialiser le mot de passe
  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!code || !newPw) { setError('Veuillez remplir tous les champs.'); return; }
    if (newPw.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Code invalide ou expiré.'); return; }
      setSuccess('Mot de passe réinitialisé ! Redirection...');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grain" />

      {/* Left */}
      <div className="login-left">
        <video src="/13509218_3840_2160_60fps.mp4" autoPlay muted loop playsInline className="login-video" />
        <div className="login-video-overlay" />
        <div className="login-left-content">
          <Link to="/login" className="login-logo">
            <div className="login-logo-icon"><Zap size={18} color="#0a0a0a" /></div>
            <span className="login-logo-text">Energy SaaS</span>
          </Link>
          <div className="login-left-bottom">
            <h2 className="login-left-title">Récupérez<br />votre accès</h2>
            <p className="login-left-sub">Un code de vérification sera envoyé à votre adresse email.</p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="login-right" ref={panelRef}>
        <div className="login-form-wrap" ref={formRef}>

          {/* Header */}
          <div className="login-form-header">
            <h1 className="login-form-title">
              {step === 1 ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
            </h1>
            <p className="login-form-sub">
              {step === 1
                ? 'Entrez votre email pour recevoir un code de récupération'
                : `Code envoyé à ${email}`}
            </p>
          </div>

          {/* Étape 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="login-form">
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

              {error   && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? <span className="login-loader" /> : <>Envoyer le code <ArrowRight size={15} /></>}
              </button>
            </form>
          )}

          {/* Étape 2 — Code + nouveau mot de passe */}
          {step === 2 && (
            <form onSubmit={handleReset} className="login-form">
              <div className="login-field">
                <label className="login-label">Code de vérification</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="login-input"
                  />
                  <button type="button" className="login-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error   && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? <span className="login-loader" /> : <>Réinitialiser <ArrowRight size={15} /></>}
              </button>

              <button type="button" className="login-back-btn" onClick={() => { setStep(1); setError(''); }}>
                <ArrowLeft size={14} /> Changer d'email
              </button>
            </form>
          )}

          <div className="login-footer-text">
            <Link to="/login" className="login-link">← Retour à la connexion</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
