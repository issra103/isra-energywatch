import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { getLatest, getSimulatorStatus, startSimulator, stopSimulator } from '../api/energyApi';
import { Wifi, WifiOff, Lightbulb, Cpu, Wind, Play, Square, Clock, AlertTriangle } from 'lucide-react';
import { NAVY, NAVY_DARK, ORANGE, MUTED, EQUIP_COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { fmtTime as fmtTimeLocale } from '../i18n/format';

function fmt(n, d = 1) { return n != null ? Number(n).toFixed(d) : '—'; }

const EQUIP_ICON = { Climatisation: Wind, Serveur: Cpu, 'Éclairage': Lightbulb };

export default function FluxEnDirect() {
  const { t, te, lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [stats, setStats] = useState({ byType: {} });
  const logsRef = useRef([]);

  const fmtTime = (ts) => fmtTimeLocale(ts, lang);

  useEffect(() => {
    getLatest().then(data => {
      logsRef.current = data.slice(0, 30);
      setLogs([...logsRef.current]);
      computeStats(logsRef.current);
    }).catch(() => {});
    getSimulatorStatus().then(s => setSimRunning(s.running)).catch(() => {});
  }, []);

  function computeStats(data) {
    const byType = {};
    data.forEach(d => {
      byType[d.type_equipement] = (byType[d.type_equipement] || 0) + 1;
    });
    setStats({ byType });
  }

  const onNewReading = useCallback((data) => {
    const idx = logsRef.current.findIndex(r => r._id === data._id);
    if (idx !== -1) logsRef.current[idx] = data;
    else logsRef.current = [data, ...logsRef.current].slice(0, 50);
    setLogs([...logsRef.current]);
    computeStats(logsRef.current);
  }, []);

  const onConnect = useCallback(() => setConnected(true), []);
  const onDisconnect = useCallback(() => setConnected(false), []);

  useSocket(onNewReading, null, null, onConnect, onDisconnect);

  const toggleSim = async () => {
    setSimLoading(true);
    try {
      if (simRunning) { await stopSimulator(); setSimRunning(false); }
      else { await startSimulator(); setSimRunning(true); }
    } catch (_) {}
    setSimLoading(false);
  };

  const anomalyCount = logs.filter(l => l.is_manual_anomaly || l.ai_detected_anomaly).length;

  return (
    <div className="page-wrapper">
      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('flux.title')}</h1>
          <p className="dui-sub">{t('flux.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span className="dui-status" style={connected ? { borderColor: 'rgba(240,160,48,0.35)' } : {}}>
            {connected ? <Wifi size={14} color={ORANGE} /> : <WifiOff size={14} />}
            {connected ? t('flux.socketOn') : t('flux.socketOff')}
          </span>
          <button
            type="button"
            className={`dui-btn-orange ${simRunning ? 'dui-btn-navy' : ''}`}
            onClick={toggleSim}
            disabled={simLoading}
          >
            {simLoading ? <Clock size={14} /> : simRunning ? <Square size={14} /> : <Play size={14} />}
            {simLoading ? '...' : simRunning ? t('common.stop') : t('common.start')}
          </button>
        </div>
      </header>

      <div className="dui-kpis dui-kpis--motion" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.25rem' }}>
        <div className="dui-kpi dui-kpi--featured dui-kpi--motion">
          <span className="dui-kpi-label">{t('flux.recentMessages')}</span>
          <div className="dui-kpi-value">{logs.length}</div>
        </div>
        <div className="dui-kpi dui-kpi--motion">
          <span className="dui-kpi-label">{t('flux.detectedAnomalies')}</span>
          <div className="dui-kpi-value" style={{ color: ORANGE }}>{anomalyCount}</div>
        </div>
        <div className="dui-kpi dui-kpi--motion">
          <span className="dui-kpi-label">{t('flux.activityByEquip')}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.5rem' }}>
            {Object.entries(stats.byType).map(([type, count]) => {
              const IconComponent = EQUIP_ICON[type];
              const c = EQUIP_COLORS[type] || NAVY;
              return (
                <span
                  key={type}
                  className="dui-badge"
                  style={{ background: `${c}18`, color: c, border: `1px solid ${c}40`, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {IconComponent && <IconComponent size={12} />} {te(type)}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dui-panel">
        <div className="dui-panel-head">
          <span className="dui-panel-title">
            <span className="pulse-dot" style={{ marginRight: 8, background: ORANGE }} />
            {t('flux.liveStream')}
          </span>
          <span style={{ fontSize: '0.75rem', color: MUTED }}>{logs.length} {t('common.entries')}</span>
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div className="dui-empty">{t('flux.waitingData')}</div>
          ) : (
            logs.map((log, i) => {
              const isAnomaly = log.is_manual_anomaly || log.ai_detected_anomaly;
              const IconComponent = EQUIP_ICON[log.type_equipement] || Cpu;
              const ec = EQUIP_COLORS[log.type_equipement] || NAVY;
              return (
                <div
                  key={log._id || i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderRadius: 10, marginBottom: 6,
                    background: isAnomaly ? 'rgba(240,160,48,0.08)' : 'var(--ui-grad-card)',
                    border: `1px solid ${isAnomaly ? 'rgba(240,160,48,0.35)' : 'var(--ui-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${ec}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ec,
                      }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: NAVY_DARK }}>{te(log.type_equipement)}</div>
                      <div style={{ fontSize: '0.7rem', color: MUTED }}>{fmtTime(log.datetime)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isAnomaly ? ORANGE : NAVY }}>
                      {fmt(log.totalConsumption, 1)} W
                    </div>
                    {isAnomaly && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: ORANGE, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <AlertTriangle size={12} /> {t('common.anomaly')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
