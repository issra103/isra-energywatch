import { useState, useEffect } from 'react';
import { getZonesDetail } from '../api/energyApi';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

import { NAVY, ORANGE, MUTED, ZONE_COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

function fmt(n, d = 2) { return n != null ? Number(n).toFixed(d) : '—'; }

export default function ZonesPage() {
  const { t } = useLanguage();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getZonesDetail()
      .then(data => setZones(data.zones || []))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  }, []);

  const total = zones.reduce((s, z) => s + (z.avg_w || 0), 0);

  const radarSubjects = [
    { key: 'avgPower', label: t('zones.avgPower') },
    { key: 'maxPower', label: t('zones.maxPower') },
    { key: 'sharePct', label: t('zones.sharePct') },
  ];

  return (
    <div className="page-wrapper">
      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('zones.title')}</h1>
          <p className="dui-sub">{t('zones.subtitle')}</p>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loader-spin" style={{ width: 40, height: 40 }} />
        </div>
      ) : zones.length === 0 ? (
        <div className="dui-empty">
          {t('zones.noData')}
        </div>
      ) : (
        <>
          <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.5rem' }}>
            <div className="dui-kpi dui-kpi--featured dui-kpi--motion">
              <span className="dui-kpi-label">{t('zones.totalEnergy')}</span>
              <div className="dui-kpi-value">{fmt(total, 2)}<span className="dui-kpi-unit"> kWh</span></div>
            </div>
            <div className="dui-kpi dui-kpi--motion">
              <span className="dui-kpi-label">{t('zones.activeZones')}</span>
              <div className="dui-kpi-value">{zones.length}</div>
            </div>
            {zones.map(z => {
              const c = ZONE_COLORS[z.zone] || NAVY;
              const pct = total > 0 ? (z.avg_w || 0) / total * 100 : 0;
              return (
                <div key={z.zone} className="dui-equip-card dui-kpi--motion">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{z.zone}</span>
                    <span className="badge" style={{ background: c + '20', color: c, border: '1px solid ' + c + '40' }}>{fmt(pct, 1)}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(15,23,42,0.08)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: pct + '%', background: c, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {zones.map(z => {
              const c = ZONE_COLORS[z.zone] || NAVY;
              const radarData = [
                { subject: radarSubjects[0].label, A: z.avg_w ? Math.min(z.avg_w / 50000 * 100, 100) : 0 },
                { subject: radarSubjects[1].label, A: z.max_w ? Math.min(z.max_w / 100000 * 100, 100) : 0 },
                { subject: radarSubjects[2].label, A: total > 0 ? (z.avg_w / total * 100) : 0 },
              ];
              return (
                <div key={z.zone} className="dui-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: '0 0 10px ' + c }} />
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: c }}>{z.zone}</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(15,23,42,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'rgba(100,116,139,0.8)' }} />
                      <Radar dataKey="A" stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 8, fontSize: 12, color: 'rgba(15,23,42,0.9)' }}
                        formatter={(v) => [fmt(v, 1) + '%', t('zones.score')]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    {[
                      { label: t('zones.avgPower'), value: fmt(z.avg_w, 0) + ' W', color: c },
                      { label: t('zones.maxPower'), value: fmt(z.max_w, 0) + ' W', color: ORANGE },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '0.75rem', background: 'rgba(15,23,42,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(15,23,42,0.07)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>{stat.label}</div>
                        <div style={{ fontWeight: 700, color: stat.color, fontSize: '0.9rem' }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
