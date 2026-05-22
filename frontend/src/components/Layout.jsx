import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Activity, ShieldAlert, TrendingUp,
  BarChart2, Layers, Lightbulb, Settings, Zap, LogOut, User,
  Sun, Moon,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',                label: 'Tableau de bord',   Icon: LayoutDashboard, section: 'Principal' },
  { to: '/dashboard/flux',            label: 'Flux en direct',     Icon: Activity,        section: 'Principal' },
  { to: '/dashboard/anomalies',       label: 'Anomalies IA',       Icon: ShieldAlert,     section: 'Analyse' },
  { to: '/dashboard/previsions',      label: 'Prévisions IA',      Icon: TrendingUp,      section: 'Analyse' },
  { to: '/dashboard/rapports',        label: 'Rapports mensuel',   Icon: BarChart2,       section: 'Rapports' },
  { to: '/dashboard/zones',           label: 'Zones énergétiques', Icon: Layers,          section: 'Rapports' },
  { to: '/dashboard/recommandations', label: 'Recommandations',    Icon: Lightbulb,       section: 'Gestion' },
  { to: '/dashboard/parametres',      label: 'Paramètres',         Icon: Settings,        section: 'Gestion' },
];

function groupBySection(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

export default function Layout() {
  const grouped = groupBySection(NAV_ITEMS);
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync user data with MongoDB
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
      <div className="bg-glow" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">Energy SaaS</div>
            <div className="sidebar-logo-sub">IoT Monitor</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflow: 'auto' }}>
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.Icon size={15} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '0 0.5rem', marginTop: 'auto' }}>
          <div className="holo-line" style={{ marginBottom: '1rem' }} />
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <User size={14} />
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
              <button className="sidebar-logout" onClick={handleLogout} title="Déconnexion">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', letterSpacing: '0.05em', marginTop: '0.75rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Energy SaaS v1.0</div>
            <div>Projet PFE — ISRA 2025</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}
