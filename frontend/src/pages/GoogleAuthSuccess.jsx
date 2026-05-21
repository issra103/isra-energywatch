import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    // Évite le double appel React StrictMode
    if (handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user  = params.get('user');

    if (token && user) {
      handled.current = true;
      try {
        const parsed = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(parsed));
        // Remplace l'URL proprement sans laisser /auth/google/success dans l'historique
        window.location.replace('/dashboard');
      } catch (e) {
        navigate('/login?error=parse', { replace: true });
      }
    } else {
      // Déjà redirigé ou token manquant
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login?error=google', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a', color: '#fff', flexDirection: 'column', gap: 12
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p>Connexion Google en cours...</p>
    </div>
  );
}
