import { useState, useEffect, useMemo } from 'react';
import { getKPIs } from '../api/energyApi';
import { Moon, Zap, RotateCcw, TrendingDown, Lightbulb, AlertCircle, Gauge } from 'lucide-react';

import { NAVY, NAVY_DARK, ORANGE, MUTED, EQUIP_COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const STATIC_TIP_DEFS = [
  { Icon: Moon, titleKey: 'recommandations.tip1Title', descKey: 'recommandations.tip1Desc', tagKey: 'recommandations.tip1Tag', color: NAVY, savingKey: 'recommandations.tip1Saving' },
  { Icon: Zap, titleKey: 'recommandations.tip2Title', descKey: 'recommandations.tip2Desc', tagKey: 'recommandations.tip2Tag', color: ORANGE, savingKey: 'recommandations.tip2Saving' },
  { Icon: RotateCcw, titleKey: 'recommandations.tip3Title', descKey: 'recommandations.tip3Desc', tagKey: 'recommandations.tip3Tag', color: NAVY_DARK, savingKey: 'recommandations.tip3Saving' },
  { Icon: Gauge, titleKey: 'recommandations.tip4Title', descKey: 'recommandations.tip4Desc', tagKey: 'recommandations.tip4Tag', color: '#5a7fa8', savingKey: 'recommandations.tip4Saving' },
];

function generateDynamicTips(kpis, t, te) {
  if (!kpis) return [];
  const tips = [];
  const equips = kpis.equipements || [];

  const sorted = [...equips].sort((a, b) => (b.total_cost_dt || 0) - (a.total_cost_dt || 0));
  if (sorted[0]) {
    const equipName = te(sorted[0].type_equipement);
    const c = EQUIP_COLORS[sorted[0].type_equipement] || '#f59e0b';
    tips.push({
      Icon: Lightbulb,
      title: t('recommandations.dynCostTitle', { equip: equipName }),
      desc: t('recommandations.dynCostDesc', { equip: equipName, cost: Number(sorted[0].total_cost_dt || 0).toFixed(4) }),
      tag: t('recommandations.dynCostTag'),
      color: c,
      saving: t('recommandations.dynCostSaving'),
      dynamic: true,
    });
  }

  if (kpis.anomaly_count > 5) {
    tips.push({
      Icon: AlertCircle,
      title: t('recommandations.dynAnomalyTitle'),
      desc: t('recommandations.dynAnomalyDesc', { count: kpis.anomaly_count }),
      tag: t('recommandations.dynAnomalyTag'),
      color: ORANGE,
      saving: t('recommandations.dynAnomalySaving'),
      dynamic: true,
    });
  }

  const sortedByPower = [...equips].sort((a, b) => (b.avg_consumption || 0) - (a.avg_consumption || 0));
  if (sortedByPower[0] && sortedByPower[0].avg_consumption > 3000) {
    const equipName = te(sortedByPower[0].type_equipement);
    const c = EQUIP_COLORS[sortedByPower[0].type_equipement] || NAVY;
    tips.push({
      Icon: TrendingDown,
      title: t('recommandations.dynOverloadTitle', { equip: equipName }),
      desc: t('recommandations.dynOverloadDesc', { power: Number(sortedByPower[0].avg_consumption).toFixed(0) }),
      tag: t('recommandations.dynOverloadTag'),
      color: c,
      saving: t('recommandations.dynOverloadSaving'),
      dynamic: true,
    });
  }

  return tips;
}

const TARIFF_DISPLAY = [
  { labelKey: 'tariff.offPeak', hoursKey: 'tariff.lowHours', rate: '0.150 DT/kWh', color: NAVY },
  { labelKey: 'tariff.normalSlot', hoursKey: 'tariff.normalHours', rate: '0.250 DT/kWh', color: NAVY_DARK },
  { labelKey: 'tariff.peakSlot', hoursKey: 'tariff.peakHours', rate: '0.350 DT/kWh', color: ORANGE },
  { labelKey: 'tariff.normalEvening', hoursKey: 'tariff.eveningHours', rate: '0.250 DT/kWh', color: '#5a7fa8' },
];

export default function Recommandations() {
  const { lang, t, te } = useLanguage();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKPIs()
      .then(setKpis)
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, []);

  const staticTips = useMemo(
    () => STATIC_TIP_DEFS.map((def) => ({
      ...def,
      title: t(def.titleKey),
      desc: t(def.descKey),
      tag: t(def.tagKey),
      saving: t(def.savingKey),
    })),
    [lang, t],
  );

  const dynamicTips = useMemo(
    () => generateDynamicTips(kpis, t, te),
    [kpis, lang, t, te],
  );

  const allTips = [...dynamicTips, ...staticTips];

  return (
    <div className="page-wrapper" key={lang}>
      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('recommandations.title')}</h1>
          <p className="dui-sub">{t('recommandations.subtitle')}</p>
        </div>
      </header>

      <div className="dui-panel" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: '0.875rem', fontSize: '0.9rem', color: NAVY_DARK }}>
          <Gauge size={18} /> {t('recommandations.tariffGrid')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {TARIFF_DISPLAY.map((slot) => (
            <div key={slot.labelKey + slot.hoursKey} className="dui-tariff-line" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700, color: slot.color, fontSize: '0.8rem', marginBottom: 2 }}>{t(slot.labelKey)}</div>
              <div style={{ fontSize: '0.72rem', color: MUTED, marginBottom: 4 }}>{t(slot.hoursKey)}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{slot.rate}</div>
            </div>
          ))}
        </div>
      </div>

      {dynamicTips.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(240,160,48,0.1)', border: '1px solid rgba(240,160,48,0.3)', borderRadius: '10px' }}>
          <div className="pulse-dot" style={{ background: ORANGE }} />
          <span style={{ fontSize: '0.8rem', color: NAVY_DARK }}>
            {t('recommandations.banner', { count: dynamicTips.length })}
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loader-spin" style={{ width: 36, height: 36 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {allTips.map((tip, i) => (
            <div
              key={`${lang}-${i}-${tip.title}`}
              className="dui-panel"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {tip.dynamic && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: tip.color + '20', color: tip.color, fontSize: '0.65rem', padding: '2px 8px', borderBottomLeftRadius: 8, fontWeight: 700 }}>
                  {t('common.personalized')}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ lineHeight: 1, marginTop: 4, color: tip.color, flexShrink: 0 }}>
                  {tip.Icon && <tip.Icon size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tip.title}</span>
                    <span className="badge" style={{ background: tip.color + '20', color: tip.color, border: '1px solid ' + tip.color + '40', fontSize: '0.65rem' }}>
                      {tip.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: MUTED, lineHeight: 1.6, margin: '0 0 0.75rem' }}>{tip.desc}</p>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tip.color }}>{tip.saving}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
