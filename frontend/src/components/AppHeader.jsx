import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Languages, User, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function roleLabel(role, t) {
  if (!role) return t('header.roleUser');
  const r = String(role).toLowerCase();
  if (r.includes('admin')) return t('header.roleAdmin');
  if (r.includes('view') || r.includes('lecteur')) return t('header.roleViewer');
  return role;
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
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const currentLang = LANG_OPTIONS.find((l) => l.id === lang) || LANG_OPTIONS[0];
  const isDark = theme === 'dark';

  return (
    <header className="app-header">
      <div className="app-header-actions">
        <div className="app-header-lang" ref={langRef}>
          <button
            type="button"
            className="app-header-icon-btn app-header-lang-btn"
            onClick={() => setLangOpen((o) => !o)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            title={t('header.language')}
          >
            <span className="app-header-flag">{currentLang.flag}</span>
            <Languages size={14} />
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
    </header>
  );
}
