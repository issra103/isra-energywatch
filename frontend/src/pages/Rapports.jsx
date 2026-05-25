import { useState, useEffect } from 'react';
import { getMonthlyReport, getLatest } from '../api/energyApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { NAVY, ORANGE, MUTED, EQUIP_COLORS, CHART_TIP } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

function fmt(n, d = 2) { return n != null ? Number(n).toFixed(d) : '—'; }

function addMonths(str, delta) {
  const [y, m] = str.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Rapports() {
  const { t, te } = useLanguage();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    if (!autoDetected) {
      setAutoDetected(true);
      getLatest().then(items => {
        if (items?.[0]?.datetime) {
          const d = new Date(items[0].datetime);
          const detected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (detected !== month) setMonth(detected);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getMonthlyReport(month)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month]);

  const dailyTotals = (() => {
    if (!data?.daily) return [];
    const byDay = {};
    data.daily.forEach(d => {
      const day = String(d._id.day).padStart(2, '0');
      const equip = d._id.type_equipement;
      if (!byDay[day]) byDay[day] = { day };
      byDay[day][equip + '_kwh']  = +(d.total_kwh || 0).toFixed(3);
      byDay[day][equip + '_cost'] = +(d.total_cost_dt || 0).toFixed(4);
      byDay[day][equip + '_anom'] = d.anomaly_count || 0;
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  })();

  const equipTotals = (() => {
    if (!data?.daily) return {};
    const totals = {};
    data.daily.forEach(d => {
      const e = d._id.type_equipement;
      if (!totals[e]) totals[e] = { kwh: 0, cost: 0, anomalies: 0 };
      totals[e].kwh     += d.total_kwh || 0;
      totals[e].cost    += d.total_cost_dt || 0;
      totals[e].anomalies += d.anomaly_count || 0;
    });
    return totals;
  })();

  const grandTotal = Object.values(equipTotals).reduce((s, z) => ({ kwh: s.kwh + z.kwh, cost: s.cost + z.cost, anomalies: s.anomalies + z.anomalies }), { kwh: 0, cost: 0, anomalies: 0 });

  const exportCSV = () => {
    if (!data?.daily || dailyTotals.length === 0) return;
    const headers = [
      t('rapports.csvDay'),
      t('rapports.csvEquip'),
      t('rapports.csvEnergy'),
      t('rapports.csvCost'),
      t('rapports.csvAnomalies'),
    ];
    const rows = data.daily.map(d => [
      String(d._id.day).padStart(2, '0'),
      te(d._id.type_equipement) || d._id.type_equipement || '-',
      (d.total_kwh || 0).toFixed(3),
      (d.total_cost_dt || 0).toFixed(4),
      d.anomaly_count || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrapper">
      <header className="dui-header">
        <div>
          <h1 className="dui-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={22} color={NAVY} /> {t('rapports.title')}
          </h1>
          <p className="dui-sub">{t('rapports.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="dui-period" onClick={() => setMonth(m => addMonths(m, -1))} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronLeft size={16} />
          </button>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="glass-input"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', colorScheme: 'light' }}
          />
          <button type="button" className="dui-period" onClick={() => setMonth(m => addMonths(m, 1))} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronRight size={16} />
          </button>
          <button type="button" className="dui-btn-orange" style={{ fontSize: '0.75rem' }} onClick={exportCSV} disabled={!data?.daily}>
            {t('common.exportCsv')}
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loader-spin" style={{ width: 40, height: 40 }} />
        </div>
      ) : !data || dailyTotals.length === 0 ? (
        <div className="dui-empty">
          {t('rapports.noData', { month })}
        </div>
      ) : (
        <>
          <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.25rem' }}>
            <div className="dui-kpi dui-kpi--featured dui-kpi--motion">
              <span className="dui-kpi-label">{t('rapports.totalEnergy')}</span>
              <div className="dui-kpi-value">{fmt(grandTotal.kwh, 2)}<span className="dui-kpi-unit"> kWh</span></div>
            </div>
            <div className="dui-kpi dui-kpi--motion">
              <span className="dui-kpi-label">{t('rapports.totalCost')}</span>
              <div className="dui-kpi-value" style={{ color: ORANGE }}>{fmt(grandTotal.cost, 3)}<span className="dui-kpi-unit"> DT</span></div>
            </div>
            <div className="dui-kpi dui-kpi--motion">
              <span className="dui-kpi-label">{t('common.anomalies')}</span>
              <div className="dui-kpi-value" style={{ color: ORANGE }}>{grandTotal.anomalies}</div>
            </div>
            <div className="dui-kpi dui-kpi--motion">
              <span className="dui-kpi-label">{t('rapports.daysWithData')}</span>
              <div className="dui-kpi-value">{dailyTotals.length}</div>
            </div>
          </div>

          <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
            {Object.entries(equipTotals).map(([equip, totals]) => {
              const c = EQUIP_COLORS[equip] || NAVY;
              const pct = grandTotal.kwh > 0 ? (totals.kwh / grandTotal.kwh * 100) : 0;
              return (
                <div key={equip} className="dui-equip-card dui-kpi--motion">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700 }}>{te(equip)}</span>
                    <span className="badge" style={{ background: c + '20', color: c, border: '1px solid ' + c + '40' }}>{fmt(pct, 1)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(15,23,42,0.08)', borderRadius: 2, marginBottom: '0.75rem' }}>
                    <div style={{ height: '100%', width: pct + '%', background: c, borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{t('common.energy')}</div>
                      <div style={{ fontWeight: 700, color: c }}>{fmt(totals.kwh, 2)} kWh</div>
                    </div>
                    <div>
                      <div style={{ color: MUTED, fontSize: '0.7rem' }}>{t('common.cost')}</div>
                      <div style={{ fontWeight: 700, color: ORANGE }}>{fmt(totals.cost, 3)} DT</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dui-panel" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>{t('rapports.dailyKwh')}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyTotals} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(100,116,139,0.8)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(100,116,139,0.8)' }} unit=" kWh" />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                {Object.entries(EQUIP_COLORS).map(([e, c]) => (
                  <Bar key={e} dataKey={e + '_kwh'} name={te(e)} fill={c} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dui-panel">
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>{t('rapports.dailyCost')}</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyTotals} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(100,116,139,0.8)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(100,116,139,0.8)' }} />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                {Object.entries(EQUIP_COLORS).map(([e, c]) => (
                  <Bar key={e} dataKey={e + '_cost'} name={te(e) + t('rapports.costSuffix')} fill={c} opacity={0.75} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
