const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <p className="font-serif text-sm text-slate-300">
          Prayer times courtesy of{" "}
          <a
            href="https://www.e-solat.gov.my/"
            target="_blank"
            rel="noreferrer"
            className="text-brass-light underline decoration-brass/40 underline-offset-2 transition-colors hover:text-brass"
          >
            JAKIM e-Solat
          </a>
          , with{" "}
          <a
            href="https://aladhan.com/"
            target="_blank"
            rel="noreferrer"
            className="text-brass-light underline decoration-brass/40 underline-offset-2 transition-colors hover:text-brass"
          >
            Aladhan
          </a>{" "}
          as fallback.
        </p>
        <p className="text-xs text-slate-500">
          © {CURRENT_YEAR} SeWaktu - Waktu Solat Malaysia · All Right Reserved
        </p>
        <p className="text-xs text-slate-500">
          Made with ❤️ by{" "}
          <a
            href="https://github.com/hilmihashim472"
            target="_blank"
            rel="noreferrer"
            className="text-brass-light underline decoration-brass/40 underline-offset-2 transition-colors hover:text-brass"
          >
            Hilmi Hashim
          </a>
        </p>
      </div>
    </footer>
  );
}
