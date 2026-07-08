import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Languages, User, ChevronDown, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PAGE_ROUTES = [
  { path: '/dashboard/flux', key: 'flux' },
  { path: '/dashboard/anomalies', key: 'anomalies' },
  { path: '/dashboard/previsions', key: 'previsions' },
  { path: '/dashboard/rapports', key: 'rapports' },
  { path: '/dashboard/zones', key: 'zones' },
  { path: '/dashboard/recommandations', key: 'recommandations' },
  { path: '/dashboard/parametres', key: 'parametres' },
  { path: '/dashboard', key: 'dashboard' },
];

function pageKeyFromPath(pathname) {
  const match = PAGE_ROUTES.find((r) =>
    r.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(r.path),
  );
  return match?.key ?? 'dashboard';
}

function roleLabel(role, t) {
  return role ? t('header.roleFinance') : t('header.roleUser');
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const LANG_OPTIONS = [
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

export default function AppHeader({ user, theme, onToggleTheme }) {
  const { lang, setLang, t } = useLanguage();
  const { pathname } = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const pageKey = useMemo(() => pageKeyFromPath(pathname), [pathname]);

  useEffect(() => {
    const close = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          <span className="app-header-brand-icon" aria-hidden>
            <Zap size={18} />
          </span>
          <div className="app-header-brand-text">
            <span className="app-header-brand-name">Energy SaaS</span>
            <span className="app-header-page">{t(`nav.${pageKey}`)}</span>
          </div>
        </div>

        <div className="app-header-toolbar">
        <div className="app-header-lang" ref={langRef}>
          <button
            type="button"
            className="app-header-icon-btn app-header-lang-btn"
            onClick={() => setLangOpen((o) => !o)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            title={t('header.language')}
          >
            <span className="app-header-lang-code">{lang.toUpperCase()}</span>
            <Languages size={15} />
            <ChevronDown size={12} className={langOpen ? 'is-open' : ''} />
          </button>
          {langOpen && (
            <ul className="app-header-dropdown" role="listbox">
              {LANG_OPTIONS.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={lang === opt.id}
                    className={lang === opt.id ? 'is-active' : ''}
                    onClick={() => {
                      setLang(opt.id);
                      setLangOpen(false);
                    }}
                  >
                    <span>{opt.flag}</span>
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="app-header-icon-btn"
          onClick={onToggleTheme}
          title={isDark ? t('header.themeLight') : t('header.themeDark')}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="app-header-divider" />

        {user && (
          <div className="app-header-profile">
            <div className="app-header-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span>{initials(user.name)}</span>
              )}
            </div>
            <div className="app-header-profile-text">
              <span className="app-header-profile-name">{user.name}</span>
              <span className="app-header-profile-role">{roleLabel(user.role, t)}</span>
            </div>
          </div>
        )}
        {!user && (
          <div className="app-header-profile">
            <div className="app-header-avatar">
              <User size={16} />
            </div>
            <div className="app-header-profile-text">
              <span className="app-header-profile-name">—</span>
              <span className="app-header-profile-role">{t('header.roleUser')}</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
