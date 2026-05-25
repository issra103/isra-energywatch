import { useState, useEffect, useCallback } from 'react';
import { getAnomalies } from '../api/energyApi';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { NAVY, NAVY_DARK, ORANGE, MUTED, EQUIP_COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { fmtDate as fmtDateLocale, fmtTime as fmtTimeLocale } from '../i18n/format';

const POLL_MS = 15000;

function fmt(n, d = 1) { return n != null ? Number(n).toFixed(d) : '—'; }

export default function AnomaliesPage() {
  const { t, te, lang } = useLanguage();
  const [anomalies, setAnomalies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fmtDate = (ts) => fmtDateLocale(ts, lang);
  const fmtLastUpdate = (d) => fmtTimeLocale(d, lang);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getAnomalies();
      setAnomalies(data);
      setLastUpdate(new Date());
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const equipTypes = ['all', ...Object.keys(EQUIP_COLORS)];

  const visible = filter === 'all'
    ? anomalies
    : anomalies.filter(a => a.type_equipement === filter);

  const statsByEquip = Object.keys(EQUIP_COLORS).map(type => ({
    type,
    count: anomalies.filter(a => a.type_equipement === type).length,
    avgPower: (() => {
      const eAnom = anomalies.filter(a => a.type_equipement === type);
      return eAnom.length ? eAnom.reduce((s, a) => s + (a.totalConsumption || 0), 0) / eAnom.length : 0;
    })(),
  }));

  return (
    <div className="page-wrapper">
      <header className="dui-header">
        <div>
          <h1 className="dui-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={22} color={ORANGE} /> {t('anomalies.title')}
          </h1>
          <p className="dui-sub">{t('anomalies.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {lastUpdate && (
            <span className="dui-status">{fmtLastUpdate(lastUpdate)}</span>
          )}
          <button type="button" className="dui-btn-orange dui-btn-navy" onClick={() => load(true)} disabled={refreshing} style={{ padding: '0.45rem 0.75rem' }}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
          </button>
        </div>
      </header>

      <div className="dui-periods" style={{ marginBottom: '1.25rem' }}>
        {equipTypes.map(eq => (
          <button
            key={eq}
            type="button"
            className={`dui-period ${filter === eq ? 'is-active' : ''}`}
            onClick={() => setFilter(eq)}
          >
            {eq === 'all' ? t('anomalies.filterAll') : te(eq)}
          </button>
        ))}
      </div>

      <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.25rem' }}>
        <div className="dui-kpi dui-kpi--featured dui-kpi--motion">
          <span className="dui-kpi-label">{t('anomalies.totalAnomalies')}</span>
          <div className="dui-kpi-value">{anomalies.length}</div>
        </div>
        {statsByEquip.map(({ type, count, avgPower }) => {
          const c = EQUIP_COLORS[type];
          return (
            <div key={type} className="dui-kpi dui-kpi--motion">
              <div className="dui-kpi-top">
                <span className="dui-kpi-label">{te(type)}</span>
                <span className="dui-badge" style={{ marginLeft: 0, background: `${c}18`, color: c }}>{count}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED }}>{t('anomalies.avgShort')} {fmt(avgPower, 0)} W</div>
              <div className="dui-bar-track" style={{ marginTop: '0.5rem' }}>
                <div className="dui-bar-fill" style={{ width: `${anomalies.length > 0 ? (count / anomalies.length) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <section className="dui-anomalies">
        <div className="dui-anomalies-head">
          <ShieldAlert size={16} color={ORANGE} />
          {t('anomalies.history')}
          <span className="dui-badge">{visible.length}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loader-spin" style={{ width: 36, height: 36 }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="dui-empty">{t('anomalies.noAnomalies')}</div>
        ) : (
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('anomalies.colDateTime')}</th>
                  <th>{t('common.equipment')}</th>
                  <th>{t('anomalies.colPower')}</th>
                  <th>{t('anomalies.colEnergy')}</th>
                  <th>{t('common.cost')}</th>
                  <th>{t('common.source')}</th>
                  <th>{t('common.aiPrediction')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a, i) => {
                  const c = EQUIP_COLORS[a.type_equipement] || NAVY;
                  return (
                    <tr key={i}>
                      <td style={{ color: MUTED, fontFamily: 'monospace', fontSize: '0.72rem' }}>{fmtDate(a.datetime)}</td>
                      <td>
                        <span className="dui-badge" style={{ background: `${c}18`, color: c, border: `1px solid ${c}40` }}>{te(a.type_equipement)}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: ORANGE }}>{fmt(a.totalConsumption, 1)} W</td>
                      <td style={{ color: NAVY }}>{fmt(a.energy_kwh, 5)} kWh</td>
                      <td style={{ color: NAVY_DARK }}>{fmt(a.cost_est, 4)} DT</td>
                      <td>
                        {a.ai_detected_anomaly
                          ? <span className="dui-badge" style={{ background: 'rgba(74,107,154,0.12)', color: NAVY_DARK }}>{t('common.ai')}</span>
                          : <span className="dui-badge">{t('common.manual')}</span>}
                      </td>
                      <td style={{ color: NAVY, fontWeight: 600 }}>{a.predicted_next_hour ? `${fmt(a.predicted_next_hour, 0)} W` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
