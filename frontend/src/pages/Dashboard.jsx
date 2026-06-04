import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { getKPIs, getLatest, getAnomalies, getSimulatorStatus, startSimulator, stopSimulator } from '../api/energyApi';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Zap, DollarSign, AlertCircle, BarChart3, TrendingUp,
  Play, Square,
} from 'lucide-react';
import { NAVY, NAVY_DARK, ORANGE, MUTED, ZONE_COLORS, CHART_TIP } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { fmtTime as fmtTimeLocale, fmtTodayDate } from '../i18n/format';

const BAR_COLORS = [NAVY, ORANGE];

const PERIOD_IDS = ['all', 'today', 'week', 'month'];

const KPI_KEYS = [
  { key: 'energy', labelKey: 'dashboard.kpiEnergy', field: 'total_kwh', unit: 'kWh', dec: 2, Icon: Zap },
  { key: 'cost', labelKey: 'dashboard.kpiCost', field: 'total_cost_dt', unit: 'DT', dec: 3, Icon: DollarSign },
  { key: 'anomaly', labelKey: 'dashboard.kpiAnomalies', field: 'anomaly_count', unit: '', dec: 0, Icon: AlertCircle },
  { key: 'power', labelKey: 'dashboard.kpiAvgPower', field: 'avg_consumption', unit: 'W', dec: 0, Icon: BarChart3 },
  { key: 'predict', labelKey: 'dashboard.kpiPredict', field: null, unit: 'W', dec: 0, Icon: TrendingUp },
];

function fmt(n, d = 1) {
  return n != null ? Number(n).toFixed(d) : '—';
}

const tip = CHART_TIP;

export default function Dashboard() {
  const { t, te, lang } = useLanguage();
  const [kpis, setKpis] = useState(null);
  const [readings, setReadings] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [simStatus, setSimStatus] = useState('unknown');
  const [simLoading, setSimLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [kpiPeriod, setKpiPeriod] = useState('all');
  const [now, setNow] = useState(() => new Date());
  const liveRef = useRef([]);

  const fmtTime = (ts) => fmtTimeLocale(ts, lang);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      const [k, r, a] = await Promise.all([getKPIs(kpiPeriod), getLatest(), getAnomalies()]);
      setKpis(k);
      liveRef.current = r.slice(0, 60);
      setReadings([...liveRef.current]);
      setAnomalies(a.slice(0, 5));
    } catch (_) {}
  }, [kpiPeriod]);

  useEffect(() => {
    load();
    getSimulatorStatus().then(s => setSimStatus(s.running ? 'running' : 'stopped')).catch(() => {});
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const onNewReading = useCallback((data) => {
    const idx = liveRef.current.findIndex(r => r._id === data._id);
    if (idx !== -1) liveRef.current[idx] = data;
    else liveRef.current = [data, ...liveRef.current].slice(0, 60);
    setReadings([...liveRef.current]);
  }, []);

  const onAnomalyDetected = useCallback((data) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, data }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 8000);
    setAnomalies(prev => [data, ...prev].slice(0, 5));
  }, []);

  const onSimStatus = useCallback((s) => setSimStatus(s.running ? 'running' : 'stopped'), []);

  useSocket(onNewReading, onAnomalyDetected, onSimStatus);

  const toggleSim = async () => {
    setSimLoading(true);
    try {
      if (simStatus === 'running') {
        await stopSimulator();
        setSimStatus('stopped');
      } else {
        await startSimulator();
        setSimStatus('running');
      }
    } catch (_) {}
    setSimLoading(false);
  };

  const chartData = [...readings].reverse().slice(-30).map(r => ({
    t: fmtTime(r.datetime),
    Zone1: +((r.consumption_zone1 || 0) / 1000).toFixed(2),
    Zone2: +((r.consumption_zone2 || 0) / 1000).toFixed(2),
    Zone3: +((r.consumption_zone3 || 0) / 1000).toFixed(2),
  }));

  const latestReading = readings[0];
  const peakData = [
    { name: t('tariff.peak'), cost: kpis?.peakCost || 0 },
    { name: t('tariff.offPeak'), cost: kpis?.offPeakCost || 0 },
  ];
  const zoneKpis = kpis?.equipements || [];
  const isRunning = simStatus === 'running';
  const peakPct = ((kpis?.peakCost || 0) / Math.max((kpis?.peakCost || 0) + (kpis?.offPeakCost || 0), 1)) * 100;

  const kpiValue = (card) => {
    if (card.key === 'predict') return fmt(latestReading?.predicted_next_hour, card.dec);
    return fmt(kpis?.[card.field], card.dec);
  };

  return (
    <div className="page-wrapper">
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(({ id, data }) => (
          <div key={id} className="dui-toast">
            <strong style={{ color: NAVY_DARK }}>{t('dashboard.toastTitle')}</strong>
            <div style={{ fontSize: '0.8rem', color: MUTED, marginTop: 4 }}>
              {te(data.type_equipement)} — {fmt(data.totalConsumption, 0)} W
            </div>
          </div>
        ))}
      </div>

      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('dashboard.title')}</h1>
          <p className="dui-sub">{fmtTodayDate(lang, now)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span className={`dui-status ${isRunning ? 'is-live' : ''}`}>
            <span className="pulse-dot" style={{ background: isRunning ? ORANGE : '#cbd5e1' }} />
            {isRunning ? t('dashboard.simActive') : t('dashboard.simStopped')}
          </span>
          <button
            type="button"
            className={`dui-btn-orange ${isRunning ? 'dui-btn-navy' : ''}`}
            onClick={toggleSim}
            disabled={simLoading}
          >
            {simLoading && <span className="loader-spin" />}
            {!simLoading && (isRunning ? <Square size={14} /> : <Play size={14} />)}
            {isRunning ? t('common.stop') : t('common.start')}
          </button>
        </div>
      </header>

      <div className="dui-periods">
        {PERIOD_IDS.map(id => (
          <button
            key={id}
            type="button"
            className={`dui-period ${kpiPeriod === id ? 'is-active' : ''}`}
            onClick={() => setKpiPeriod(id)}
          >
            {t(`common.${id}`)}
          </button>
        ))}
      </div>

      <section className="dui-kpis dui-kpis--dashboard">
        {KPI_KEYS.map(card => (
          <div key={card.key} className="dui-kpi dui-kpi--grad">
            <div className="dui-kpi-top">
              <span className="dui-kpi-label">{t(card.labelKey)}</span>
              <span className="dui-icon-box">
                <card.Icon size={18} />
              </span>
            </div>
            <div className="dui-kpi-value">
              {kpiValue(card)}
              {card.unit && <span className="dui-kpi-unit">{card.unit}</span>}
            </div>
          </div>
        ))}
      </section>

      {zoneKpis.length > 0 && (
        <section className="dui-equip">
          {zoneKpis.map(z => (
            <div key={z.type_equipement} className="dui-equip-card">
              <div style={{ fontWeight: 700, color: NAVY_DARK, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                {te(z.type_equipement)}
              </div>
              <div className="dui-tariff-line">
                <span>{t('common.average')}</span>
                <span>{fmt(z.avg_consumption, 0)} W</span>
              </div>
              <div className="dui-tariff-line">
                <span>{t('common.energy')}</span>
                <span>{fmt(z.total_kwh, 3)} kWh</span>
              </div>
              <div className="dui-tariff-line">
                <span>{t('common.cost')}</span>
                <span>{fmt(z.total_cost_dt, 4)} DT</span>
              </div>
              <div className="dui-tariff-line">
                <span>{t('common.anomalies')}</span>
                <span>{z.anomaly_count}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="dui-chart-full">
        <div className="dui-panel dui-panel--chart-wide">
          <div className="dui-panel-head">
            <span className="dui-panel-title">{t('dashboard.chartZones')}</span>
            <div className="dui-legend">
              {Object.entries(ZONE_COLORS).map(([z, c]) => (
                <span key={z}>
                  <span className="dui-legend-dot" style={{ background: c }} />
                  {z}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gd_navy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NAVY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gd_orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gd_navy_dark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NAVY_DARK} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={NAVY_DARK} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: MUTED }} interval="preserveStartEnd" axisLine={{ stroke: '#dde3eb' }} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} labelStyle={{ color: NAVY_DARK, fontWeight: 600, fontSize: 11 }} />
              <Area type="monotone" dataKey="Zone1" stroke={NAVY} strokeWidth={2.5} fill="url(#gd_navy)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="Zone2" stroke={ORANGE} strokeWidth={2.5} fill="url(#gd_orange)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="Zone3" stroke={NAVY_DARK} strokeWidth={2.5} fill="url(#gd_navy_dark)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dui-grid-duo">
        <div className="dui-panel">
          <div className="dui-panel-head">
            <span className="dui-panel-title">{t('dashboard.chartTariff')}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: '#dde3eb' }} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={72}>
                {peakData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dui-panel">
          <div className="dui-panel-head">
            <span className="dui-panel-title">{t('dashboard.chartSteg')}</span>
          </div>
          <div className="dui-tariff-line">
            <span>{t('tariff.peak')}</span>
            <span style={{ fontWeight: 700, color: NAVY }}>{fmt(kpis?.peakCost, 4)} DT</span>
          </div>
          <div className="dui-tariff-line">
            <span>{t('tariff.offPeak')}</span>
            <span style={{ fontWeight: 700, color: ORANGE }}>{fmt(kpis?.offPeakCost, 4)} DT</span>
          </div>
          <div className="dui-bar-track" style={{ marginTop: '0.5rem' }}>
            <div className="dui-bar-fill" style={{ width: `${peakPct}%` }} />
          </div>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: MUTED }}>
            {t('tariff.peakCostPct', { pct: fmt(peakPct, 0) })}
          </p>
        </div>
      </section>

      <section className="dui-anomalies">
        <div className="dui-anomalies-head">
          <AlertCircle size={18} color={ORANGE} />
          {t('dashboard.lastAnomalies')}
          <span className="dui-badge">{anomalies.length}</span>
        </div>
        {anomalies.length === 0 ? (
          <div className="dui-empty">{t('dashboard.noAnomalies')}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.equipment')}</th>
                <th>{t('common.power')}</th>
                <th>{t('common.estCost')}</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => (
                <tr key={i}>
                  <td style={{ color: MUTED }}>{fmtTime(a.datetime)}</td>
                  <td style={{ fontWeight: 600, color: NAVY_DARK }}>{te(a.type_equipement)}</td>
                  <td style={{ fontWeight: 700, color: NAVY }}>{fmt(a.totalConsumption, 0)} W</td>
                  <td style={{ color: MUTED }}>{fmt(a.cost_est, 4)} DT</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
