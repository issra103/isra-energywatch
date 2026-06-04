import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Check, Pencil, X as XIcon } from 'lucide-react';
import { getActiveTariff, updateTariff as updateTariffApi } from '../api/energyApi';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_TARIFFS = [
  { labelKey: 'tariff.offPeakSlot', hoursKey: 'tariff.lowHours', rate: 0.150, tone: 'navy', key: 'heure_creuse', slotId: 'creuse' },
  { labelKey: 'tariff.normalSlot', hoursKey: 'tariff.normalHours', rate: 0.250, tone: 'navy-dark', key: 'heure_pleine', slotId: 'normal_am' },
  { labelKey: 'tariff.peakSlot', hoursKey: 'tariff.peakHours', rate: 0.350, tone: 'orange', key: 'heure_pleine', slotId: 'peak' },
  { labelKey: 'tariff.normalEvening', hoursKey: 'tariff.eveningHours', rate: 0.250, tone: 'slate', key: 'heure_pleine', slotId: 'normal_pm' },
];

function TariffCard({ item, onSave }) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.rate.toFixed(3)));

  useEffect(() => {
    if (!editing) setDraft(String(item.rate.toFixed(3)));
  }, [item.rate, lang, editing]);

  const commit = () => {
    const v = parseFloat(draft);
    if (!isNaN(v) && v > 0) {
      onSave(v);
      setEditing(false);
    }
  };

  const cancel = () => {
    setDraft(String(item.rate.toFixed(3)));
    setEditing(false);
  };

  return (
    <article className={`dui-settings-card dui-settings-card--${item.tone}`}>
      <div className="dui-settings-card-top">
        <div>
          <h3 className="dui-settings-card-title">{t(item.labelKey)}</h3>
          <p className="dui-settings-card-hours">{t(item.hoursKey)}</p>
        </div>
        {!editing && (
          <button
            type="button"
            className="dui-settings-card-edit"
            onClick={() => {
              setDraft(String(item.rate.toFixed(3)));
              setEditing(true);
            }}
            aria-label={t('parametres.editTariff')}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="dui-settings-card-rate">
        {editing ? (
          <div className="dui-settings-card-edit-row">
            <input
              className="dui-settings-card-input"
              type="number"
              step="0.001"
              min="0.001"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              autoFocus
            />
            <span className="dui-settings-card-unit">DT/kWh</span>
            <button type="button" onClick={commit} className="dui-settings-card-btn dui-settings-card-btn--ok">
              <Check size={14} />
            </button>
            <button type="button" onClick={cancel} className="dui-settings-card-btn">
              <XIcon size={14} />
            </button>
          </div>
        ) : (
          <span className="dui-settings-card-value">
            {item.rate.toFixed(3)}
            <small> DT/kWh</small>
          </span>
        )}
      </div>
    </article>
  );
}

export default function Parametres() {
  const { lang, t } = useLanguage();
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);
  const [saved, setSaved] = useState(false);

  const loadTariffs = useCallback(async () => {
    try {
      const data = await getActiveTariff();
      if (data) {
        setTariffs((prev) =>
          prev.map((row) => {
            if (row.key === 'heure_creuse') return { ...row, rate: data.heure_creuse };
            if (row.key === 'heure_pleine') return { ...row, rate: data.heure_pleine };
            return row;
          }),
        );
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadTariffs();
  }, [loadTariffs]);

  const updateTariff = (index, newRate) => {
    setTariffs((prev) => prev.map((row, i) => (i === index ? { ...row, rate: newRate } : row)));
  };

  const handleSaveAll = async () => {
    try {
      const creuse = tariffs.find((row) => row.key === 'heure_creuse')?.rate || 0.15;
      const pleine = tariffs.find((row) => row.slotId === 'normal_am')?.rate || 0.25;
      await updateTariffApi({ heure_pleine: pleine, heure_creuse: creuse });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving tariffs:', err);
    }
  };

  return (
    <div className="page-wrapper" key={lang}>
      <header className="dui-header">
        <div>
          <h1 className="dui-title">{t('parametres.title')}</h1>
          <p className="dui-sub">{t('parametres.subtitle')}</p>
        </div>
      </header>

      <section className="dui-panel dui-settings-tariff">
        <div className="dui-panel-head">
          <div className="dui-settings-panel-title">
            <CreditCard size={18} />
            <span>{t('parametres.tariffTitle')}</span>
          </div>
          <button type="button" className="dui-btn-orange" onClick={handleSaveAll}>
            {saved ? (
              <>
                <Check size={14} /> {t('common.saved')}
              </>
            ) : (
              t('common.apply')
            )}
          </button>
        </div>

        <div className="dui-settings-grid">
          {tariffs.map((row, i) => (
            <TariffCard key={`${lang}-${row.slotId}`} item={row} onSave={(rate) => updateTariff(i, rate)} />
          ))}
        </div>

        <p className="dui-settings-hint">{t('parametres.tariffHint')}</p>
      </section>
    </div>
  );
}
