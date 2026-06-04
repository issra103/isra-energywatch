import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Activity, ShieldAlert, TrendingUp,
  BarChart2, Layers, Lightbulb, Settings, Zap, LogOut,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import AppHeader from './AppHeader';

const NAV_ITEMS = [
  { to: '/dashboard', key: 'dashboard', Icon: LayoutDashboard, section: 'Principal' },
  { to: '/dashboard/flux', key: 'flux', Icon: Activity, section: 'Principal' },
  { to: '/dashboard/anomalies', key: 'anomalies', Icon: ShieldAlert, section: 'Analyse' },
  { to: '/dashboard/previsions', key: 'previsions', Icon: TrendingUp, section: 'Analyse' },
  { to: '/dashboard/rapports', key: 'rapports', Icon: BarChart2, section: 'Rapports' },
  { to: '/dashboard/zones', key: 'zones', Icon: Layers, section: 'Rapports' },
  { to: '/dashboard/recommandations', key: 'recommandations', Icon: Lightbulb, section: 'Gestion' },
  { to: '/dashboard/parametres', key: 'parametres', Icon: Settings, section: 'Gestion' },
];

function groupBySection(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

function LayoutInner() {
  const grouped = groupBySection(NAV_ITEMS);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.error('Erreur sync user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} color="white" />
          </div>
          <div className="sidebar-logo-text">Energy SaaS</div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-label">{t(`sections.${section}`)}</div>
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.Icon size={15} style={{ flexShrink: 0 }} />
                  <span>{t(`nav.${item.key}`)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title={t('header.logout')}
          >
            <LogOut size={16} />
            {t('header.logout')}
          </button>
        </div>
      </aside>

      <main className={`main-content dashboard-ui ${theme === 'dark' ? 'theme-dark' : ''}`}>
        <AppHeader user={user} theme={theme} onToggleTheme={toggleTheme} />
        <div className="main-content-body">
          <Outlet />
        </div>
      </main>
    </>
  );
}

export default function Layout() {
  return <LayoutInner />;
}
