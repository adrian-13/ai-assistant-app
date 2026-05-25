import { useRegisterSW } from "virtual:pwa-register/react";

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Kontrola aktualizácií každú minútu
        setInterval(() => registration.update(), 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="animate-fade-up fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--accent)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px var(--accent-soft)",
      }}
    >
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
        Nová verzia je dostupná
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-xl px-3.5 py-1.5 text-sm font-medium"
        style={{
          background: "var(--accent)",
          color: "var(--bubble-user-text)",
        }}
      >
        Aktualizovať
      </button>
    </div>
  );
}
