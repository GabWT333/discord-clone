import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://85.155.151.62:8082"; // <-- cambia con il tuo IP
const TOKEN  = "cambia_questo_token_segreto"; // <-- stesso token del server.js

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [nick, setNick] = useState("");
  const [err,  setErr]  = useState("");

  const go = () => {
    if (nick.trim().length < 2) { setErr("Minimo 2 caratteri"); return; }
    onLogin(nick.trim());
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0d1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "env(safe-area-inset-top,20px) 24px env(safe-area-inset-bottom,20px)",
      fontFamily: "monospace",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🖥️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#00ff88" }}>VPS Terminal</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>SSH nel browser</div>
        </div>

        <div style={{ fontSize: 11, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Nickname</div>
        <input
          value={nick}
          onChange={e => setNick(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go()}
          placeholder="es. Gab"
          autoComplete="off" autoCapitalize="off"
          style={{
            width: "100%", background: "#161b22",
            border: "1px solid #30363d", borderRadius: 8,
            padding: "14px 16px", color: "#e6edf3",
            fontSize: 16, fontFamily: "monospace", marginBottom: 8,
            outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "#00ff88"}
          onBlur={e => e.target.style.borderColor = "#30363d"}
        />
        {err && <div style={{ color: "#f85149", fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}

        <button onClick={go} style={{
          width: "100%", background: "#00ff88", border: "none",
          borderRadius: 8, padding: 14, color: "#0d1117",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "monospace", minHeight: 50,
        }}>
          Connetti alla VPS →
        </button>
      </div>
    </div>
  );
}

// ─── Terminal ─────────────────────────────────────────────────
function Terminal({ user, onLogout }) {
  const [lines, setLines]   = useState([`\x1b[32mBenvenuto ${user}! Connessione in corso...\x1b[0m`]);
  const [input, setInput]   = useState("");
  const [status, setStatus] = useState("connecting"); // connecting | connected | error
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const wsRef    = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Aggiunge testo grezzo (con escape ANSI) al terminale
  const pushRaw = useCallback((text) => {
    // Divide per \n e \r\n mantenendo le righe
    setLines(prev => {
      const last = prev[prev.length - 1] || "";
      const combined = last + text;
      const split = combined.split(/\r?\n/);
      return [...prev.slice(0, -1), ...split];
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${TOKEN}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      pushRaw("\r\n\x1b[32m✓ Connesso alla VPS\x1b[0m\r\n");
    };

    ws.onmessage = (e) => pushRaw(e.data);

    ws.onerror = () => {
      setStatus("error");
      pushRaw("\r\n\x1b[31m✗ Errore connessione. Controlla IP e server.js\x1b[0m\r\n");
    };

    ws.onclose = () => {
      setStatus("error");
      pushRaw("\r\n\x1b[33m⚡ Connessione chiusa.\x1b[0m\r\n");
    };

    return () => ws.close();
  }, [pushRaw]);

  // Scroll automatico in basso
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const sendCommand = () => {
    const cmd = input;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "input", data: cmd + "\n" }));
    if (cmd.trim()) {
      setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    }
    setInput("");
    setHistIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx]);
    } else if (e.key === "c" && e.ctrlKey) {
      wsRef.current?.send(JSON.stringify({ type: "input", data: "\x03" }));
      setInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const ANSI_RE = new RegExp(String.fromCharCode(27) + "\\[[^" + String.fromCharCode(27) + "]*m|" + String.fromCharCode(27) + "\\[[^m]*[A-Z]|" + String.fromCharCode(27) + "\\]", "g");

  // Converte escape ANSI in testo pulito
  const renderLine = (line, idx) => {
    const clean = line.replace(ANSI_RE, "");
    return (
      <div key={idx} style={{
        fontFamily: "monospace",
        fontSize: 13,
        lineHeight: 1.6,
        color: "#e6edf3",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        minHeight: 4,
      }}>
        {clean}
      </div>
    );
  };

  const statusColor = { connecting: "#f0b232", connected: "#00ff88", error: "#f85149" }[status];
  const statusLabel = { connecting: "Connessione...", connected: "Connesso", error: "Errore" }[status];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: "#0d1117",
      fontFamily: "monospace",
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>

      {/* Topbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        background: "#161b22",
        borderBottom: "1px solid #21262d",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🖥️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>VPS Terminal</div>
            <div style={{ fontSize: 11, color: "#555" }}>{user}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor }} />
            <span style={{ fontSize: 11, color: statusColor }}>{statusLabel}</span>
          </div>
          <button onClick={() => { wsRef.current?.close(); onLogout(); }} style={{
            background: "none", border: "1px solid #30363d", borderRadius: 6,
            color: "#8b949e", fontSize: 12, padding: "5px 10px",
            cursor: "pointer", fontFamily: "monospace",
          }}>Esci</button>
        </div>
      </div>

      {/* Output terminale */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, overflowY: "auto",
          padding: "12px 14px",
          WebkitOverflowScrolling: "touch",
          cursor: "text",
        }}
      >
        {lines.map((line, i) => renderLine(line, i))}
        <div ref={bottomRef} />
      </div>

      {/* Barra comandi sticky in basso */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid #21262d",
        background: "#161b22",
        padding: "10px 14px",
      }}>
        {/* Tasti rapidi */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          marginBottom: 10, paddingBottom: 2,
          WebkitOverflowScrolling: "touch",
        }}>
          {["Tab","↑","↓","Ctrl+C","Ctrl+L","ls","cd ..","pwd","clear"].map(k => (
            <button key={k} onMouseDown={e => {
              e.preventDefault();
              if (k === "Tab") {
                wsRef.current?.send(JSON.stringify({ type: "input", data: "\t" }));
              } else if (k === "↑") {
                const idx = Math.min(histIdx + 1, history.length - 1);
                setHistIdx(idx); setInput(history[idx] || "");
              } else if (k === "↓") {
                const idx = Math.max(histIdx - 1, -1);
                setHistIdx(idx); setInput(idx === -1 ? "" : history[idx]);
              } else if (k === "Ctrl+C") {
                wsRef.current?.send(JSON.stringify({ type: "input", data: "\x03" }));
                setInput("");
              } else if (k === "Ctrl+L") {
                setLines([]);
              } else {
                // invia il comando direttamente
                wsRef.current?.send(JSON.stringify({ type: "input", data: k + "\n" }));
              }
            }} style={{
              background: "#21262d", border: "1px solid #30363d",
              borderRadius: 6, padding: "6px 12px",
              color: "#8b949e", fontSize: 12,
              cursor: "pointer", fontFamily: "monospace",
              whiteSpace: "nowrap", minHeight: 34,
            }}>
              {k}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00ff88", fontSize: 14, flexShrink: 0 }}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un comando..."
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1, background: "#0d1117",
              border: "1px solid #30363d", borderRadius: 8,
              padding: "12px 14px", color: "#e6edf3",
              fontSize: 14, fontFamily: "monospace",
              outline: "none", minHeight: 46,
            }}
            onFocus={e => e.target.style.borderColor = "#00ff88"}
            onBlur={e => e.target.style.borderColor = "#30363d"}
          />
          <button onClick={sendCommand} style={{
            background: "#00ff88", border: "none",
            borderRadius: 8, padding: "12px 16px",
            color: "#0d1117", fontSize: 18,
            cursor: "pointer", minHeight: 46, minWidth: 46,
          }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; background: #0d1117; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; }
        input { outline: none; -webkit-tap-highlight-color: transparent; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
      {user
        ? <Terminal user={user} onLogout={() => setUser(null)} />
        : <LoginScreen onLogin={setUser} />
      }
    </>
  );
}
