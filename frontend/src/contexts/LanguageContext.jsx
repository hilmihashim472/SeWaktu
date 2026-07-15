import { createContext, useContext, useEffect, useMemo, useState } from "react";
import ms from "../i18n/ms";
import en from "../i18n/en";

const STORAGE_KEY = "sewaktu.language";
const DICTS = { ms, en };
const LANGUAGES = Object.keys(DICTS);

const LanguageContext = createContext(null);

function lookup(dict, key) {
  return key.split(".").reduce((obj, k) => (obj && typeof obj === "object" ? obj[k] : undefined), dict);
}

function interpolate(value, params) {
  if (typeof value !== "string" || !params) return value;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replaceAll(`{{${k}}}`, String(v)),
    value
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : "ms";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next) => {
    if (LANGUAGES.includes(next)) setLanguageState(next);
  };

  const t = useMemo(() => {
    const dict = DICTS[language];
    const fallback = DICTS.ms;
    return (key, params) => {
      const value = lookup(dict, key) ?? lookup(fallback, key) ?? key;
      return interpolate(value, params);
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
