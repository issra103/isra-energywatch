import { useState, useEffect, useCallback } from 'react';
import { getPredictions } from '../api/energyApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { NAVY, NAVY_DARK, ORANGE, MUTED, EQUIP_COLORS, EQUIP_PRED, CHART_TIP } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { fmtTime as fmtTimeLocale } from '../i18n/format';

const POLL_MS = 15000;

function fmt(n, d = 1) { return n != null ? Number(n).toFixed(d) : '—'; }

export default function Previsions() {
  const { t, te, lang } = useLanguage();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fmtTime = (ts) => fmtTimeLocale(ts, lang);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getPredictions();
      setPredictions(data);
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

  const chartData = (() => {
    const byTs = {};
    [...predictions].reverse().forEach(r => {
      const timeKey = fmtTime(r.datetime);
      if (!timeKey || timeKey === '—') return;
      if (!byTs[timeKey]) byTs[timeKey] = { t: timeKey };
      const key = r.type_equipement || 'Unknown';
      byTs[timeKey][`${key}_real`] = +((r.totalConsumption || 0) / 1000).toFixed(2);
      if (r.predicted_next_hour) byTs[timeKey][`${key}_pred`] = +((r.predicted_next_hour) / 1000).toFixed(2);
    });
    return Object.values(byTs);
  })();

  const mapeByEquip = (() => {
    const errors = {};
    predictions.forEach(r => {
      if (!r.predicted_next_hour || r.totalConsumption === 0) return;
      const key = r.type_equipement;
      if (!errors[key]) errors[key] = { sum: 0, count: 0 };
      errors[key].sum += Math.abs((r.totalConsumption - r.predicted_next_hour) / r.totalConsumption);
      errors[key].count += 1;
    });
    const result = {};
    Object.entries(errors).forEach(([k, e]) => {
      result[k] = e.count > 0 ? (e.sum / e.count * 100) : null;
    });
    return result;
  })();

  const predsWithPred = predictions.filter(r => r.predicted_next_hour != null).length;

  return (
    <div className="page-wrapper">
      <header className="dui-header">
        <div>
          <h1 className="dui-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={22} color={NAVY} /> {t('previsions.title')}
          </h1>
          <p className="dui-sub">{t('previsions.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {lastUpdate && (
            <span className="dui-status">
              {fmtTime(lastUpdate)}
            </span>
          )}
          <button type="button" className="dui-btn-orange" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
            {t('common.refresh')}
          </button>
        </div>
      </header>

      <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.25rem' }}>
        {Object.entries(EQUIP_COLORS).map(([equip, c]) => {
          const mape = mapeByEquip[equip];
          return (
            <div key={equip} className="dui-kpi dui-kpi--motion">
              <span className="dui-kpi-label">{t('previsions.mape', { equip: te(equip) })}</span>
              <div className="dui-kpi-value" style={{ color: c, fontSize: '1.75rem' }}>
                {mape != null ? `${fmt(mape, 2)}%` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED }}>{t('previsions.mae')}</div>
            </div>
          );
        })}
        <div className="dui-kpi dui-kpi--featured dui-kpi--motion">
          <span className="dui-kpi-label">{t('previsions.readingsWithPred')}</span>
          <div className="dui-kpi-value">{predsWithPred}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('common.onTotal', { total: predictions.length })}</div>
        </div>
      </div>

      <div className="dui-panel" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: MUTED }}>{t('previsions.algorithm')}</div>
            <div style={{ fontWeight: 700, color: NAVY_DARK }}>{t('previsions.rfRegressor')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: MUTED }}>{t('previsions.features')}</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: NAVY_DARK }}>{t('previsions.featuresList')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: MUTED }}>{t('previsions.training')}</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: NAVY_DARK }}>{t('previsions.trainingData')}</div>
          </div>
          <span className="dui-badge" style={{ alignSelf: 'center' }}>{t('previsions.modelActive')}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loader-spin" style={{ width: 40, height: 40 }} />
        </div>
      ) : predsWithPred === 0 ? (
        <div className="dui-empty">{t('previsions.noPredictions')}</div>
      ) : (
        <>
          <div className="dui-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="dui-panel-head">
              <span className="dui-panel-title">{t('previsions.chartTitle')}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: MUTED, margin: '0 0 1rem' }}>{t('previsions.chartLegend')}</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: MUTED }} interval={Math.floor(chartData.length / 8)} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} unit=" kW" />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                {Object.entries(EQUIP_COLORS).map(([e, c]) => (
                  <Line key={`${e}_real`} type="monotone" dataKey={`${e}_real`} name={t('previsions.legendReal', { equip: te(e) })} stroke={c} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
                {Object.entries(EQUIP_PRED).map(([e, c]) => (
                  <Line key={`${e}_pred`} type="monotone" dataKey={`${e}_pred`} name={t('previsions.legendPred', { equip: te(e) })} stroke={c} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <section className="dui-anomalies">
            <div className="dui-anomalies-head">{t('previsions.detailTitle')}</div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('previsions.colHour')}</th>
                    <th>{t('common.equipment')}</th>
                    <th>{t('previsions.colReal')}</th>
                    <th>{t('previsions.colPred')}</th>
                    <th>{t('previsions.colError')}</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.filter(r => r.predicted_next_hour != null).slice(0, 40).map((r, i) => {
                    const c = EQUIP_COLORS[r.type_equipement] || NAVY;
                    const err = r.totalConsumption > 0
                      ? Math.abs((r.totalConsumption - r.predicted_next_hour) / r.totalConsumption * 100)
                      : null;
                    return (
                      <tr key={i}>
                        <td style={{ color: MUTED, fontFamily: 'monospace', fontSize: '0.75rem' }}>{fmtTime(r.datetime)}</td>
                        <td><span className="dui-badge" style={{ background: `${c}18`, color: c, border: `1px solid ${c}40` }}>{te(r.type_equipement)}</span></td>
                        <td style={{ fontWeight: 700, color: NAVY_DARK }}>{fmt(r.totalConsumption, 0)}</td>
                        <td style={{ color: NAVY }}>{fmt(r.predicted_next_hour, 0)}</td>
                        <td style={{ color: err != null && err > 10 ? ORANGE : NAVY_DARK }}>
                          {err != null ? `${fmt(err, 1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
