import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import usePageMeta from "../hooks/usePageMeta";

export default function NotFound() {
  const { t } = useLanguage();
  usePageMeta({ title: t("seo.notFoundTitle") });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:px-6">
      <p className="font-serif text-6xl text-accent">404</p>
      <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">{t("notFound.title")}</h1>
      <p className="text-ink-400">{t("notFound.body")}</p>
      <Link
        to="/"
        className="mt-2 text-sm text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("notFound.home")}
      </Link>
    </div>
  );
}
