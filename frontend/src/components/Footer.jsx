import { useLanguage } from "../contexts/LanguageContext";

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-line bg-overlay-soft">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <p className="text-xs text-ink-500">{t("footer.copyright", { year: CURRENT_YEAR })}</p>
      </div>
    </footer>
  );
}
