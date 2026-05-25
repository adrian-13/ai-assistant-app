import { useState, useRef, useEffect, type FormEvent } from "react";
import Markdown from "react-markdown";

// Typy pre správy v chate
interface Message {
  role: "user" | "assistant";
  content: string;
}

// URL webhooku z environment premennej
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL as string;

// Získanie alebo vytvorenie session ID
function getOrCreateSessionId(): string {
  const key = "ai_assistant_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Automatické scrollovanie na koniec správ
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Uloženie preferencie tmavého režimu + trieda na body
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Nová konverzácia
  function handleNewConversation() {
    const id = crypto.randomUUID();
    localStorage.setItem("ai_assistant_session_id", id);
    setSessionId(id);
    setMessages([]);
    setInput("");
  }

  // Odoslanie správy na webhook
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP chyba: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message ?? "Žiadna odpoveď.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Chyba pri komunikácii so serverom: ${error instanceof Error ? error.message : "Neznáma chyba"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  // Odoslanie cez Enter (Shift+Enter pre nový riadok)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="grain flex h-full flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* Hlavička */}
      <header
        className="relative z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Názov */}
        <h1
          className="text-lg tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          AI Asistent
        </h1>

        {/* Akcie */}
        <div className="flex items-center gap-1">
          {/* Nová konverzácia */}
          <button
            onClick={handleNewConversation}
            title="Nová konverzácia"
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              color: "var(--accent)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Nová konverzácia"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" />
            </svg>
          </button>

          {/* Oddeľovač */}
          <div className="mx-1 h-5 w-px" style={{ background: "var(--border-strong)" }} />

          {/* Dark mode prepínač */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Svetlý režim" : "Tmavý režim"}
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              color: "var(--text-secondary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Prepnúť tmavý/svetlý režim"
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Zoznam správ */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">

          {/* Prázdny stav */}
          {messages.length === 0 && (
            <div className="animate-fade-in flex flex-col items-center justify-center pt-24 text-center">
              {/* Maskot */}
              <div className="animate-float relative mb-8">
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Žiara za maskotom */}
                  <circle cx="48" cy="48" r="44" fill="var(--accent-soft)" />
                  {/* Hlava */}
                  <rect x="20" y="18" width="56" height="52" rx="22" fill="var(--accent)" />
                  {/* Anténka */}
                  <circle cx="48" cy="14" r="4" fill="var(--accent)" />
                  <rect x="46" y="14" width="4" height="8" rx="2" fill="var(--accent)" />
                  {/* Oči – biely základ */}
                  <ellipse cx="36" cy="42" rx="7" ry="7.5" fill="white" />
                  <ellipse cx="60" cy="42" rx="7" ry="7.5" fill="white" />
                  {/* Oči – zreničky */}
                  <ellipse cx="37.5" cy="43" rx="3.5" ry="4" fill="#1a1815" />
                  <ellipse cx="61.5" cy="43" rx="3.5" ry="4" fill="#1a1815" />
                  {/* Odlesky v očiach */}
                  <circle cx="39" cy="41" r="1.5" fill="white" />
                  <circle cx="63" cy="41" r="1.5" fill="white" />
                  {/* Úsmev */}
                  <path d="M38 54 C42 60, 54 60, 58 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Líčka */}
                  <ellipse cx="28" cy="52" rx="5" ry="3.5" fill="var(--accent-hover)" opacity="0.45" />
                  <ellipse cx="68" cy="52" rx="5" ry="3.5" fill="var(--accent-hover)" opacity="0.45" />
                  {/* Uši / bočné prvky */}
                  <rect x="12" y="36" width="8" height="16" rx="4" fill="var(--accent)" />
                  <rect x="76" y="36" width="8" height="16" rx="4" fill="var(--accent)" />
                </svg>
                {/* Jemná žiara */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    animation: "pulse-ring 3s ease-in-out infinite",
                    boxShadow: "0 0 40px var(--accent-glow)",
                  }}
                />
              </div>
              <h2
                className="mb-2 text-2xl"
                style={{ fontFamily: "'Instrument Serif', serif", color: "var(--text-primary)" }}
              >
                Ako vám môžem pomôcť?
              </h2>
              <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Napíšte správu nižšie a začneme konverzáciu. Som tu, aby som vám pomohol s čímkoľvek.
              </p>
            </div>
          )}

          {/* Správy */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-fade-up flex"
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
              }}
            >
              {/* Avatar asistenta */}
              {msg.role === "assistant" && (
                <div
                  className="mr-2.5 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  A
                </div>
              )}

              <div
                className="max-w-[80%] rounded-2xl px-4 py-3"
                style={{
                  background: msg.role === "user" ? "var(--bubble-user)" : "var(--bubble-assistant)",
                  color: msg.role === "user" ? "var(--bubble-user-text)" : "var(--text-primary)",
                  boxShadow: msg.role === "user" ? "var(--shadow-md)" : "var(--shadow-sm)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  borderRadius: msg.role === "user"
                    ? "1.25rem 1.25rem 0.375rem 1.25rem"
                    : "1.25rem 1.25rem 1.25rem 0.375rem",
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Indikátor načítavania */}
          {isLoading && (
            <div className="animate-fade-up flex items-start">
              <div
                className="mr-2.5 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                A
              </div>
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "var(--bubble-assistant)",
                  border: "1px solid var(--border)",
                  borderRadius: "1.25rem 1.25rem 1.25rem 0.375rem",
                }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: "var(--accent)",
                        animation: `dot-bounce 1.2s ease-in-out ${j * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Vstupné pole */}
      <div
        className="relative z-10 px-4 pb-5 pt-3"
        style={{
          background: `linear-gradient(to top, var(--bg-primary) 60%, transparent)`,
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl overflow-hidden rounded-2xl"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            transition: "box-shadow 0.25s ease, border-color 0.25s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 0 3px var(--accent-soft)`;
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
            }
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napíšte správu..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 pb-0 pt-3.5 text-[0.9375rem] leading-relaxed outline-none"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <span className="pl-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Shift + Enter pre nový riadok
            </span>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background: (!isLoading && input.trim()) ? "var(--accent)" : "var(--bg-tertiary)",
                color: (!isLoading && input.trim()) ? "var(--bubble-user-text)" : "var(--text-muted)",
                cursor: (!isLoading && input.trim()) ? "pointer" : "default",
                opacity: (!isLoading && input.trim()) ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim()) {
                  e.currentTarget.style.background = "var(--accent-hover)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px var(--accent-glow)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = (!isLoading && input.trim()) ? "var(--accent)" : "var(--bg-tertiary)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Odoslať
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
