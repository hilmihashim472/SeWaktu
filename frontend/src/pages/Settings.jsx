import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

const THEME_OPTIONS = [
  {
    value: "system",
    labelKey: "settings.system",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8M12 16v4" />
      </>
    ),
  },
  {
    value: "light",
    labelKey: "settings.light",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"
        />
      </>
    ),
  },
  {
    value: "dark",
    labelKey: "settings.dark",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.5a8.5 8.5 0 1 1-11-11 7 7 0 0 0 11 11z" />,
  },
];

const LANGUAGE_OPTIONS = [
  { value: "ms", label: "Bahasa Melayu" },
  { value: "en", label: "English" },
];

function SettingsSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-line bg-tint p-5 backdrop-blur-sm">
      <h2 className="font-serif text-lg text-ink-100">{title}</h2>
      <p className="mt-1 text-sm text-ink-400">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Settings({ notifications }) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleToggleNotifications = () => {
    if (notifications.enabled) {
      notifications.disable();
    } else {
      notifications.enable();
    }
  };

  const notificationsStatus =
    notifications.permission === "unsupported"
      ? t("settings.notificationsUnsupported")
      : notifications.permission === "denied"
      ? t("settings.notificationsBlocked")
      : notifications.enabled
      ? t("settings.notificationsEnabled")
      : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">{t("settings.title")}</h1>
      </div>

      <SettingsSection title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                  isActive
                    ? "border-brass bg-brass/10 text-accent-strong"
                    : "border-line text-ink-400 hover:border-line-strong hover:text-ink-200"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`h-6 w-6 ${isActive ? "text-accent" : ""}`}
                  aria-hidden="true"
                >
                  {opt.icon}
                </svg>
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.language")} description={t("settings.languageDesc")}>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isActive = language === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                aria-pressed={isActive}
                className={`rounded-lg border p-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                  isActive
                    ? "border-brass bg-brass/10 text-accent-strong"
                    : "border-line text-ink-400 hover:border-line-strong hover:text-ink-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.notifications")} description={t("settings.notificationsDesc")}>
        <button
          type="button"
          onClick={handleToggleNotifications}
          disabled={notifications.permission === "unsupported"}
          aria-pressed={notifications.enabled}
          className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {notifications.enabled ? t("settings.notificationsDisable") : t("settings.notificationsEnable")}
        </button>
        {notificationsStatus && <p className="mt-3 text-xs text-ink-500">{notificationsStatus}</p>}
      </SettingsSection>
    </div>
  );
}
