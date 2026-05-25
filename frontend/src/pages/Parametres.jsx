import { useState, useEffect, useCallback } from 'react';
import { getSimulatorStatus, startSimulator, stopSimulator, getActiveTariff, updateTariff as updateTariffApi } from '../api/energyApi';
import axios from 'axios';
import {
  RefreshCw, Play, Square, Cpu, Server, Info, CreditCard,
  Check, Pencil, X as XIcon,
} from 'lucide-react';
import { NAVY, NAVY_DARK, ORANGE, MUTED } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

function StatusBadge({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        className={ok ? 'pulse-dot' : ''}
        style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? ORANGE : '#94a3b8', flexShrink: 0 }}
      />
      <span style={{ fontSize: '0.8rem', color: ok ? NAVY_DARK : MUTED }}>{label}</span>
    </div>
  );
}

const DEFAULT_TARIFFS = [
  { labelKey: 'tariff.offPeakSlot', rate: 0.150, color: NAVY, key: 'heure_creuse', slotId: 'creuse' },
  { labelKey: 'tariff.normalSlot', rate: 0.250, color: NAVY_DARK, key: 'heure_pleine', slotId: 'normal_am' },
  { labelKey: 'tariff.peakSlot', rate: 0.350, color: ORANGE, key: 'heure_pleine', slotId: 'peak' },
  { labelKey: 'tariff.normalEvening', rate: 0.250, color: '#5a7fa8', key: 'heure_pleine', slotId: 'normal_pm' },
];

function TariffRow({ item, onSave }) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.rate.toFixed(3)));

  useEffect(() => {
    if (!editing) setDraft(String(item.rate.toFixed(3)));
  }, [item.rate, lang, editing]);

  const commit = () => {
    const v = parseFloat(draft);
    if (!isNaN(v) && v > 0) { onSave(v); setEditing(false); }
  };
  const cancel = () => { setDraft(String(item.rate.toFixed(3))); setEditing(false); };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.625rem 0.75rem',
      background: item.color + '10', borderRadius: '0.625rem',
      border: '1px solid ' + item.color + '30',
    }}>
      <span style={{ fontSize: '0.8rem', color: NAVY_DARK }}>{t(item.labelKey)}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {editing ? (
          <>
            <input
              className="glass-input"
              type="number"
              step="0.001"
              min="0.001"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              autoFocus
              style={{ width: 90, padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', textAlign: 'right' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DT/kWh</span>
            <button onClick={commit} className="btn btn-emerald" style={{ padding: '0.25rem 0.5rem' }}><Check size={13} /></button>
            <button onClick={cancel} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }}><XIcon size={13} /></button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.rate.toFixed(3)} DT/kWh
            </span>
            <button
              onClick={() => { setDraft(String(item.rate.toFixed(3))); setEditing(true); }}
              className="btn btn-ghost"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              <Pencil size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Parametres() {
  const { lang, t } = useLanguage();
  const [simStatus, setSimStatus] = useState('unknown');
  const [simLoading, setSimLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const [aiOk, setAiOk] = useState(null);
  const [checksLoading, setChecksLoading] = useState(true);
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);
  const [saved, setSaved] = useState(false);

  const simStatusLabel = isRunning => {
    if (isRunning) return t('common.active');
    if (simStatus === 'stopped') return t('common.stopped');
    return t('common.unknown');
  };

  const serviceStatusLabel = (ok) => {
    if (ok === null) return t('common.checking');
    return ok ? t('common.online') : t('common.offline');
  };

  const checkServices = useCallback(async () => {
    setChecksLoading(true);
    const results = await Promise.allSettled([
      getSimulatorStatus().then(s => setSimStatus(s.status)).catch(() => setSimStatus('unknown')),
      axios.get('http://localhost:4000/api/energy/kpis', { timeout: 3000, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(() => setBackendOk(true)).catch(() => setBackendOk(false)),
      axios.get('http://localhost:8000/health', { timeout: 3000 }).then(() => setAiOk(true)).catch(() => setAiOk(false)),
      getActiveTariff(),
    ]);

    const tRes = results[3];
    if (tRes.status === 'fulfilled' && tRes.value) {
      setTariffs(prev => prev.map(row => {
        if (row.key === 'heure_creuse') return { ...row, rate: tRes.value.heure_creuse };
        if (row.key === 'heure_pleine') return { ...row, rate: tRes.value.heure_pleine };
        return row;
      }));
    }
    setChecksLoading(false);
  }, []);

  useEffect(() => { checkServices(); }, [checkServices]);

  const toggleSim = async () => {
    setSimLoading(true);
    try {
      if (simStatus === 'running') { await stopSimulator(); setSimStatus('stopped'); }
      else { await startSimulator(); setSimStatus('running'); }
    } catch (_) {}
    setSimLoading(false);
  };

  const updateTariff = (index, newRate) => {
    setTariffs(prev => prev.map((row, i) => i === index ? { ...row, rate: newRate } : row));
  };

  const handleSaveAll = async () => {
    try {
      const creuse = tariffs.find(row => row.key === 'heure_creuse')?.rate || 0.15;
      const pleine = tariffs.find(row => row.slotId === 'normal_am')?.rate || 0.25;
      await updateTariffApi({ heure_pleine: pleine, heure_creuse: creuse });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving tariffs:', err);
    }
  };

  const isRunning = simStatus === 'running';

  const simMeta = [
    { labelKey: 'parametres.freq', valueKey: 'parametres.freqVal' },
    { labelKey: 'parametres.zones', valueKey: 'parametres.zonesVal' },
    { labelKey: 'parametres.source', valueKey: 'parametres.sourceVal' },
    { labelKey: 'parametres.endpoint', valueKey: 'parametres.endpointVal' },
  ];

  const services = [
    { nameKey: 'parametres.svcBackend', descKey: 'parametres.svcBackendDesc', port: 4000, ok: backendOk, tech: 'Node.js 18 · Express 4.18' },
    { nameKey: 'parametres.svcAi', descKey: 'parametres.svcAiDesc', port: 8000, ok: aiOk, tech: 'Python 3.11 · FastAPI · uvicorn' },
    { nameKey: 'parametres.svcFront', descKey: 'parametres.svcFrontDesc', port: 3000, ok: true, tech: 'React 18 · Vite · Tailwind CSS' },
  ];

  const sysInfo = [
    { labelKey: 'parametres.sysProject', valueKey: 'parametres.sysProjectVal' },
    { labelKey: 'parametres.sysVersion', valueKey: 'parametres.sysVersionVal' },
    { labelKey: 'parametres.sysDb', valueKey: 'parametres.sysDbVal', mono: true },
    { labelKey: 'parametres.sysCollection', valueKey: 'parametres.sysCollectionVal', mono: true },
    { labelKey: 'parametres.sysArch', valueKey: 'parametres.sysArchVal' },
    { labelKey: 'parametres.sysProto', valueKey: 'parametres.sysProtoVal' },
    { labelKey: 'parametres.sysPredict', valueKey: 'parametres.sysPredictVal' },
    { labelKey: 'parametres.sysDetect', valueKey: 'parametres.sysDetectVal' },
  ];

  return (
    <div className="page-wrapper" key={lang}>
      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('parametres.title')}</h1>
          <p className="dui-sub">{t('parametres.subtitle')}</p>
        </div>
        <button type="button" className="dui-btn-orange dui-btn-navy" onClick={checkServices} disabled={checksLoading}>
          <RefreshCw size={14} style={checksLoading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          {t('common.refresh')}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

        <div className="dui-panel">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: NAVY_DARK }}>
            <Cpu size={16} style={{ color: NAVY }} />
            {t('parametres.simTitle')}
            <span className={`badge ${isRunning ? 'badge-emerald' : ''}`} style={{ marginLeft: 4 }}>
              {simStatusLabel(isRunning)}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: MUTED, marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {t('parametres.simDesc')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
            {simMeta.map(({ labelKey, valueKey }) => (
              <div key={labelKey} className="dui-tariff-line" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <div style={{ color: MUTED, fontSize: '0.7rem' }}>{t(labelKey)}</div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace', color: NAVY_DARK }}>{t(valueKey)}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`dui-btn-orange ${isRunning ? 'dui-btn-navy' : ''}`}
            onClick={toggleSim}
            disabled={simLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {simLoading
              ? <span className="loader-spin" />
              : isRunning ? <Square size={14} /> : <Play size={14} />
            }
            {simLoading ? '...' : isRunning ? t('parametres.stopSim') : t('parametres.startSim')}
          </button>
        </div>

        <div className="dui-panel">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: NAVY_DARK }}>
            <Server size={16} style={{ color: NAVY }} />
            {t('parametres.servicesTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {services.map(svc => (
              <div key={svc.nameKey} className="dui-tariff-line" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: NAVY_DARK }}>{t(svc.nameKey)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: MUTED }}>:{svc.port}</span>
                    <StatusBadge ok={svc.ok} label={serviceStatusLabel(svc.ok)} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: MUTED }}>{t(svc.descKey)}</div>
                <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: 2, fontFamily: 'monospace' }}>{svc.tech}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dui-panel">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: NAVY_DARK }}>
            <Info size={16} style={{ color: NAVY }} />
            {t('parametres.sysTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sysInfo.map(({ labelKey, valueKey, mono }) => (
              <div key={labelKey} className="dui-tariff-line">
                <span>{t(labelKey)}</span>
                <span style={{ fontFamily: mono ? 'monospace' : 'inherit' }}>{t(valueKey)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dui-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: ORANGE }}>
              <CreditCard size={16} />
              {t('parametres.tariffTitle')}
            </div>
            <button
              type="button"
              className="dui-btn-orange"
              onClick={handleSaveAll}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              {saved ? <><Check size={13} /> {t('common.saved')}</> : t('common.apply')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {tariffs.map((row, i) => (
              <TariffRow
                key={`${lang}-${row.slotId}`}
                item={row}
                onSave={rate => updateTariff(i, rate)}
              />
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: MUTED, lineHeight: 1.5 }}>
            {t('parametres.tariffHint')}
          </p>
        </div>

      </div>
    </div>
  );
}
