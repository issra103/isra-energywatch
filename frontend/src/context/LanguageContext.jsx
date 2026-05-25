import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';
import { getLocale } from '../i18n/format';

const LanguageContext = createContext(null);

function interpolate(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    str,
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'fr';
  }, [lang]);

  const t = useCallback(
    (path, vars) => {
      const keys = path.split('.');
      let val = translations[lang];
      for (const k of keys) {
        val = val?.[k];
      }
      if (val == null) {
        val = translations.fr;
        for (const k of keys) {
          val = val?.[k];
        }
      }
      return interpolate(val ?? path, vars);
    },
    [lang],
  );

  const te = useCallback(
    (equipName) => {
      const key = `equip.${equipName}`;
      const translated = t(key);
      return translated !== key ? translated : equipName;
    },
    [t],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, te, locale: getLocale(lang) }),
    [lang, t, te],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
