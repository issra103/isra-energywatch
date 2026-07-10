import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Check, Pencil, X as XIcon } from 'lucide-react';
import { getActiveTariff, updateTariff as updateTariffApi } from '../api/energyApi';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_TARIFFS = [
  { labelKey: 'tariff.offPeakSlot', hoursKey: 'tariff.lowHours', rate: 0.150, tone: 'orange', key: 'heure_creuse', slotId: 'creuse' },
  { labelKey: 'tariff.normalSlot', hoursKey: 'tariff.normalHours', rate: 0.250, tone: 'navy-dark', key: 'heure_pleine', slotId: 'pleine' },
];

function TariffCard({ item, onSave }) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.rate.toFixed(3)));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) {
      setDraft(String(item.rate.toFixed(3)));
      setError('');
    }
  }, [item.rate, lang, editing]);

  const validate = (value) => {
    if (!value || value.trim() === '') {
      return 'Le tarif ne peut pas être vide.';
    }
    const v = parseFloat(value);
    if (isNaN(v)) {
      return 'Veuillez entrer un nombre valide.';
    }
    if (v <= 0) {
      return 'Le tarif doit être supérieur à 0.';
    }
    return '';
  };

  const commit = () => {
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    const v = parseFloat(draft);
    onSave(v);
    setEditing(false);
    setError('');
  };

  const cancel = () => {
    setDraft(String(item.rate.toFixed(3)));
    setEditing(false);
    setError('');
  };

  const validationError = validate(draft);

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
              setError('');
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
              className={`dui-settings-card-input ${validationError ? 'dui-input-error' : ''}`}
              type="number"
              step="0.001"
              min="0.001"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              autoFocus
            />
            <span className="dui-settings-card-unit">DT/kWh</span>
            <button 
              type="button" 
              onClick={commit} 
              className={`dui-settings-card-btn dui-settings-card-btn--ok ${validationError ? 'dui-btn-disabled' : ''}`}
              disabled={!!validationError}
            >
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
        {error && (
          <p className="dui-error-message" style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

export default function Parametres() {
  const { lang, t } = useLanguage();
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);
  const [saved, setSaved] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [recalculatedCount, setRecalculatedCount] = useState(null);

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
    setGlobalError('');
    setRecalculatedCount(null);
  };

  const handleSaveAll = async () => {
    const creuse = tariffs.find((row) => row.key === 'heure_creuse')?.rate;
    const pleine = tariffs.find((row) => row.key === 'heure_pleine')?.rate;

    // Vérification uniquement au clic sur Appliquer
    if (creuse <= 0 || pleine <= 0 || !creuse || !pleine) {
      setGlobalError('Erreur : Tarifs invalides (>0).');
      return;
    }

    try {
      setGlobalError('');
      setRecalculatedCount(0);
      setSaved(true);
      const result = await updateTariffApi({ heure_pleine: pleine, heure_creuse: creuse });
      setRecalculatedCount(result.recalculatedCount ?? 0);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving tariffs:', err);
      setSaved(false);
      setRecalculatedCount(null);
      setGlobalError(err.response?.data?.error || 'Erreur lors de la sauvegarde des tarifs.');
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
          <button 
            type="button" 
            className={`dui-btn-orange ${globalError ? 'dui-btn-disabled' : ''}`}
            onClick={handleSaveAll}
            disabled={!!globalError}
          >
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

        {globalError && (
          <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
            {globalError}
          </p>
        )}

        {recalculatedCount !== null && !globalError && (
          <>
            <div className="dui-settings-saved">
              <Check size={14} />
              <span>{t('common.saved')}</span>
            </div>
            <div className="dui-settings-success">
              <Check size={16} />
              <span>{t('parametres.recalculated', { count: recalculatedCount })}</span>
            </div>
          </>
        )}

        <p className="dui-settings-hint">{t('parametres.tariffHint')}</p>
      </section>
    </div>
  );
}
