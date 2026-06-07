import { useState, useRef, useEffect, useCallback } from "react";

// ─── Firebase config rimossa — login semplice con username ───

// ─── VPS API ─────────────────────────────────────────────────
const API_URL = "http://85.155.151.62:8080";
const API_TOKEN = "bld333_xK9mP2qR7vN4wL8zA5";
const apiHeaders = { "Content-Type": "application/json", "x-api-token": API_TOKEN };
async function api(path, method = "GET", body) {
  try {
    const r = await fetch(API_URL + path, { method, headers: apiHeaders, body: body ? JSON.stringify(body) : undefined });
    return await r.json();
  } catch { return { error: "Connessione fallita" }; }
}

// ─── Chat Data ───────────────────────────────────────────────
const CHAT_DATA = {
  servers: [
    { id: 1, name: "BLD BLOOD", icon: "🩸", color: "#c0392b" },
    { id: 2, name: "Gaming Hub", icon: "🎮", color: "#8e44ad" },
    { id: 3, name: "Dev Zone",   icon: "⚙️",  color: "#2980b9" },
  ],
  channels: {
    1: [
      { id: 101, name: "generale",  type: "text" },
      { id: 102, name: "annunci",   type: "text" },
      { id: 103, name: "bot-test",  type: "text" },
      { id: 104, name: "vocale-1",  type: "voice" },
    ],
    2: [{ id: 201, name: "generale", type: "text" }, { id: 202, name: "fps", type: "text" }],
    3: [{ id: 301, name: "generale", type: "text" }, { id: 302, name: "javascript", type: "text" }],
  },
  messages: {
    101: [
      { id: 1, author: "Gab",     avatar: "G", color: "#e74c3c", content: "Benvenuti nel server BLD BLOOD 🩸", time: "Oggi alle 10:00" },
      { id: 2, author: "Lucifero",avatar: "L", color: "#8e44ad", content: "Pronto per il bot!",               time: "Oggi alle 10:02" },
    ],
    102: [{ id: 1, author: "Gab", avatar: "G", color: "#e74c3c", content: "📢 Prima release disponibile!", time: "Oggi alle 09:00" }],
    103: [], 201: [], 202: [], 301: [], 302: [],
  },
  members: {
    1: [
      { id: 1, name: "Gab",      status: "online", role: "Owner",  avatar: "G", color: "#e74c3c" },
      { id: 2, name: "Lucifero", status: "online", role: "Admin",  avatar: "L", color: "#8e44ad" },
      { id: 3, name: "333staff", status: "idle",   role: "Member", avatar: "3", color: "#f39c12" },
    ],
    2: [{ id: 1, name: "Gab", status: "online", role: "Owner", avatar: "G", color: "#e74c3c" }],
    3: [{ id: 1, name: "Gab", status: "online", role: "Owner", avatar: "G", color: "#e74c3c" }],
  },
};

const STATUS_COLORS = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" };
const AVATAR_COLORS = ["#e74c3c","#8e44ad","#2980b9","#27ae60","#f39c12","#16a085","#d35400"];

// ─── Shared Components ───────────────────────────────────────
function Avatar({ letter, color, size = 36, status }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 700, color: "#fff" }}>
        {letter}
      </div>
      {status !== undefined && (
        <div style={{ position: "absolute", bottom: -1, right: -1, width: size * 0.32, height: size * 0.32, borderRadius: "50%", background: STATUS_COLORS[status], border: "2px solid #1e1f22" }} />
      )}
    </div>
  );
}

function ActionBtn({ label, color = "#5865f2", onClick, small }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => { setLoading(true); await onClick(); setLoading(false); };
  return (
    <button onClick={handle} disabled={loading} style={{ background: loading ? "#4f545c" : color, border: "none", borderRadius: 8, padding: small ? "7px 14px" : "10px 18px", color: "#fff", fontSize: small ? 12 : 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, minHeight: 36 }}>
      {loading ? "..." : label}
    </button>
  );
}

function StatusBadge({ status }) {
  const colors = { active: "#23a55a", inactive: "#f23f43", online: "#23a55a", stopped: "#f23f43", errored: "#f0b232" };
  const c = colors[status] || "#96989d";
  return <span style={{ background: c + "22", color: c, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{status}</span>;
}

function Gauge({ label, value, max, unit = "", color = "#5865f2" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const c = pct > 85 ? "#f23f43" : pct > 60 ? "#f0b232" : color;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#dcddde" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{value}{unit} / {max}{unit}</span>
      </div>
      <div style={{ height: 8, background: "#1e1f22", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: c, borderRadius: 10, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Login Screen (senza Firebase/SMS) ───────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    const name = username.trim();
    if (!name) { setError("Inserisci un nickname"); return; }
    if (name.length < 2) { setError("Minimo 2 caratteri"); return; }
    if (name.length > 20) { setError("Massimo 20 caratteri"); return; }
    setLoading(true);
    // Simula breve caricamento
    await new Promise(r => setTimeout(r, 400));
    onLogin({
      name,
      avatar: name[0].toUpperCase(),
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      status: "online",
    });
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #1a0a0a 0%, #1e1f22 50%, #0d1117 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "env(safe-area-inset-top, 20px) 20px env(safe-area-inset-bottom, 20px) 20px",
      fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{
        background: "rgba(43,45,49,0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        padding: "44px 28px 36px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 64, marginBottom: 12, filter: "drop-shadow(0 4px 16px rgba(192,57,43,0.5))" }}>🩸</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>BLD BLOOD</div>
          <div style={{ fontSize: 14, color: "#96989d", marginTop: 6 }}>Inserisci il tuo nickname per entrare</div>
        </div>

        {/* Input nickname */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#96989d", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Nickname</div>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="es. Gab, Lucifero..."
          autoComplete="off"
          autoCapitalize="off"
          style={{
            width: "100%",
            background: "#1e1f22",
            border: "2px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "16px 18px",
            color: "#fff",
            fontSize: 17,
            fontFamily: "inherit",
            outline: "none",
            marginBottom: 8,
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#c0392b"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />

        {error && (
          <div style={{ color: "#f23f43", fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#4f545c" : "linear-gradient(135deg, #c0392b, #e74c3c)",
            border: "none",
            borderRadius: 12,
            padding: "16px",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            marginTop: 4,
            boxShadow: loading ? "none" : "0 4px 20px rgba(192,57,43,0.4)",
            transition: "all 0.2s",
            minHeight: 52,
          }}
        >
          {loading ? "Accesso..." : "Entra nel Server 🩸"}
        </button>
      </div>
    </div>
  );
}

// ─── VPS Manager Panel ────────────────────────────────────────
function VPSPanel() {
  const [tab, setTab] = useState("status");
  const [status, setStatus] = useState(null);
  const [services, setServices] = useState([]);
  const [pm2, setPm2] = useState([]);
  const [log, setLog] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStatus   = useCallback(async () => { const r = await api("/status");   if (!r.error) setStatus(r); }, []);
  const loadServices = useCallback(async () => { const r = await api("/services"); if (Array.isArray(r)) setServices(r); }, []);
  const loadPm2      = useCallback(async () => { const r = await api("/pm2");      if (Array.isArray(r)) setPm2(r); }, []);

  useEffect(() => { loadStatus(); loadServices(); loadPm2(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => {
      if (tab === "status")   loadStatus();
      if (tab === "services") loadServices();
      if (tab === "bot")      loadPm2();
    }, 10000);
    return () => clearInterval(iv);
  }, [autoRefresh, tab]);

  const serviceAction = async (name, action) => {
    const r = await api(`/service/${name}/${action}`, "POST");
    setLog(r.output || r.error || "OK");
    await loadServices();
  };
  const pm2Action = async (name, action) => {
    const r = await api(`/pm2/${name}/${action}`, "POST");
    setLog(r.output || r.error || "OK");
    if (action !== "logs") await loadPm2();
  };
  const deploy = async (repo) => {
    setLog("Deploy in corso...");
    const r = await api(`/deploy/${repo}`, "POST");
    setLog(r.output || r.error);
  };

  const tabs = [
    { id: "status",   label: "📊 Stato" },
    { id: "services", label: "⚙️ Servizi" },
    { id: "bot",      label: "🤖 Bot" },
    { id: "deploy",   label: "🚀 Deploy" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", background: "#313338", WebkitOverflowScrolling: "touch" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>🖥️ VPS Manager</div>
          <div style={{ fontSize: 11, color: "#96989d" }}>Controllo completo della VPS</div>
        </div>
        <div onClick={() => setAutoRefresh(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "#2b2d31", borderRadius: 20, padding: "7px 14px", minHeight: 36 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? "#23a55a" : "#96989d" }} />
          <span style={{ fontSize: 12, color: "#96989d" }}>{autoRefresh ? "Live 10s" : "Pausa"}</span>
        </div>
      </div>

      {/* Tabs — scrollabili orizzontalmente */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "#5865f2" : "#2b2d31", border: "none", borderRadius: 10, padding: "10px 16px", color: tab === t.id ? "#fff" : "#96989d", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", minHeight: 40 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status */}
      {tab === "status" && (
        <div style={{ background: "#2b2d31", borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>Sistema</div>
            <ActionBtn label="↻ Aggiorna" small onClick={loadStatus} />
          </div>
          {status ? (
            <>
              <Gauge label="CPU" value={status.cpu} max={100} unit="%" color="#5865f2" />
              <Gauge label="RAM" value={status.ram.used} max={status.ram.total} unit=" MB" color="#23a55a" />
              <div style={{ fontSize: 13, color: "#96989d", marginTop: 4 }}>💾 Disco: {status.disk.used} / {status.disk.total} ({status.disk.percent})</div>
              <div style={{ fontSize: 13, color: "#96989d", marginTop: 8 }}>⏱ Uptime: {status.uptime}</div>
            </>
          ) : <div style={{ color: "#96989d", fontSize: 13 }}>Connessione alla VPS...</div>}
        </div>
      )}

      {/* Services */}
      {tab === "services" && (
        <div style={{ background: "#2b2d31", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>Servizi Systemd</div>
            <ActionBtn label="↻" small onClick={loadServices} />
          </div>
          {services.length === 0 && <div style={{ color: "#96989d", fontSize: 13 }}>Caricamento...</div>}
          {services.map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#fff", fontSize: 14, marginBottom: 5 }}>{s.name}</div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <ActionBtn label="▶" small color="#23a55a" onClick={() => serviceAction(s.name, "start")} />
                <ActionBtn label="↻" small color="#f0b232" onClick={() => serviceAction(s.name, "restart")} />
                <ActionBtn label="■" small color="#f23f43" onClick={() => serviceAction(s.name, "stop")} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PM2 Bot */}
      {tab === "bot" && (
        <div style={{ background: "#2b2d31", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>Bot WhatsApp (PM2)</div>
            <ActionBtn label="↻" small onClick={loadPm2} />
          </div>
          {pm2.length === 0 && <div style={{ color: "#96989d", fontSize: 13 }}>Nessun processo PM2 trovato</div>}
          {pm2.map(p => (
            <div key={p.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                    <StatusBadge status={p.status} />
                    <span style={{ fontSize: 11, color: "#96989d" }}>CPU: {p.cpu}%</span>
                    <span style={{ fontSize: 11, color: "#96989d" }}>RAM: {p.memory}MB</span>
                    <span style={{ fontSize: 11, color: "#96989d" }}>Restart: {p.restarts}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ActionBtn label="▶ Start"   small color="#23a55a" onClick={() => pm2Action(p.name, "start")} />
                <ActionBtn label="↻ Restart" small color="#f0b232" onClick={() => pm2Action(p.name, "restart")} />
                <ActionBtn label="■ Stop"    small color="#f23f43" onClick={() => pm2Action(p.name, "stop")} />
                <ActionBtn label="📋 Logs"   small color="#5865f2" onClick={() => pm2Action(p.name, "logs")} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deploy */}
      {tab === "deploy" && (
        <div style={{ background: "#2b2d31", borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 14 }}>Deploy</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { repo: "discord-clone",  label: "💬 Discord Clone",  path: "/root/discord-clone" },
              { repo: "whatsapp-bot",   label: "🤖 WhatsApp Bot",   path: "/root/whatsapp-bot" },
            ].map(r => (
              <div key={r.repo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, background: "#1e1f22", borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: "#96989d", fontFamily: "monospace" }}>{r.path}</div>
                </div>
                <ActionBtn label="git pull" color="#5865f2" onClick={() => deploy(r.repo)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log output */}
      {log && (
        <div style={{ background: "#1e1f22", borderRadius: 10, padding: 14, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#96989d", textTransform: "uppercase" }}>Output</span>
            <span onClick={() => setLog("")} style={{ fontSize: 16, color: "#96989d", cursor: "pointer", padding: "0 4px" }}>✕</span>
          </div>
          <pre style={{ fontSize: 12, color: "#23a55a", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 220, overflowY: "auto" }}>{log}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [me, setMe] = useState(null);
  const [data, setData] = useState(CHAT_DATA);
  const [activeServer, setActiveServer] = useState(1);
  const [activeChannel, setActiveChannel] = useState(101);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const bottomRef = useRef(null);

  const VPS_SERVER_ID = 999;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel, data.messages]);

  if (!me) return <LoginScreen onLogin={setMe} />;

  const isVPS = activeServer === VPS_SERVER_ID;
  const currentServer = activeServer === VPS_SERVER_ID
    ? { id: VPS_SERVER_ID, name: "VPS Manager", icon: "🖥️", color: "#2ecc71" }
    : data.servers.find(s => s.id === activeServer);
  const channels = isVPS ? [{ id: 9001, name: "pannello", type: "text" }] : (data.channels[activeServer] || []);
  const messages = isVPS ? [] : (data.messages[activeChannel] || []);
  const members  = isVPS ? [] : (data.members[activeServer] || []);
  const currentChannel = channels.find(c => c.id === activeChannel) || channels[0];
  const onlineCount = members.filter(m => m.status === "online").length;

  const sendMessage = () => {
    if (!input.trim() || isVPS) return;
    const newMsg = {
      id: Date.now(), author: me.name, avatar: me.avatar, color: me.color,
      content: input.trim(),
      time: "Oggi alle " + new Date().getHours() + ":" + String(new Date().getMinutes()).padStart(2, "0"),
    };
    setData(prev => ({ ...prev, messages: { ...prev.messages, [activeChannel]: [...(prev.messages[activeChannel] || []), newMsg] } }));
    setInput("");
  };

  const addServer = () => {
    if (!newServerName.trim()) return;
    const icons = ["🌟","🔥","💎","🚀","⚡","🎯"];
    const newId = Date.now();
    const newChId = newId + 1;
    setData(prev => ({
      ...prev,
      servers: [...prev.servers, { id: newId, name: newServerName.trim(), icon: icons[Math.floor(Math.random()*icons.length)], color: AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)] }],
      channels: { ...prev.channels, [newId]: [{ id: newChId, name: "generale", type: "text" }] },
      messages: { ...prev.messages, [newChId]: [] },
      members:  { ...prev.members,  [newId]: [{ id: 1, name: me.name, status: "online", role: "Owner", avatar: me.avatar, color: me.color }] },
    }));
    setActiveServer(newId); setActiveChannel(newChId);
    setNewServerName(""); setShowAddServer(false); setShowSidebar(false);
  };

  const switchServer = (id) => {
    setActiveServer(id);
    if (id === VPS_SERVER_ID) { setActiveChannel(9001); }
    else { setActiveChannel(data.channels[id][0].id); }
    setShowSidebar(false);
  };

  const allServers = [...data.servers, { id: VPS_SERVER_ID, name: "VPS Manager", icon: "🖥️", color: "#2ecc71" }];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body {
          background: #1e1f22;
          color: #dcddde;
          font-family: 'Syne', sans-serif;
          /* safe area Android / Xiaomi */
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 3px; }
        input { outline: none; -webkit-tap-highlight-color: transparent; }
        button { -webkit-tap-highlight-color: transparent; }
        .msg-row:active { background: rgba(255,255,255,0.04); }
        .ch-item {
          padding: 9px 12px;
          cursor: pointer;
          color: #96989d;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 8px;
          margin: 2px 8px;
          transition: all 0.15s;
          min-height: 40px;
        }
        .ch-item:active { background: rgba(255,255,255,0.08); color: #dcddde; }
        .ch-item.active { background: rgba(255,255,255,0.1); color: #fff; }
      `}</style>

      {/* Root container — usa 100dvh per Android con barra navigazione */}
      <div style={{ display: "flex", height: "100dvh", overflow: "hidden", position: "relative" }}>

        {/* Overlay scuro quando sidebar aperta */}
        {showSidebar && (
          <div
            onClick={() => setShowSidebar(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, backdropFilter: "blur(2px)" }}
          />
        )}

        {/* ── SIDEBAR (slide-in da sinistra) ── */}
        <div style={{
          display: "flex",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          zIndex: 60,
          transform: showSidebar ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
          {/* Colonna icone server */}
          <div style={{
            width: 66,
            background: "#1e1f22",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "14px 0",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}>
            {allServers.map(s => (
              <div key={s.id} onClick={() => switchServer(s.id)} style={{ position: "relative", cursor: "pointer", marginBottom: 10 }}>
                <div style={{
                  position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)",
                  width: 4,
                  height: s.id === activeServer ? 38 : 8,
                  background: "#fff",
                  borderRadius: "0 4px 4px 0",
                  transition: "height 0.2s",
                }} />
                <div style={{
                  width: 48, height: 48,
                  borderRadius: s.id === activeServer ? 16 : 24,
                  background: s.id === activeServer ? s.color : "#36393f",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                  transition: "all 0.2s",
                  boxShadow: s.id === activeServer ? "0 0 0 2px " + s.color : "none",
                }}>
                  {s.icon}
                </div>
              </div>
            ))}
            <div style={{ width: 28, height: 1, background: "#36393f", margin: "8px 0" }} />
            <div
              onClick={() => { setShowAddServer(true); }}
              style={{ width: 48, height: 48, borderRadius: 24, background: "#36393f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#23a55a", cursor: "pointer" }}
            >+</div>
          </div>

          {/* Colonna canali */}
          <div style={{ width: 220, background: "#2b2d31", display: "flex", flexDirection: "column" }}>
            {/* Header server */}
            <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: currentServer?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{currentServer?.icon}</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentServer?.name}</span>
            </div>
            {/* Lista canali */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", WebkitOverflowScrolling: "touch" }}>
              {!isVPS && <>
                <div style={{ padding: "10px 14px 4px", fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>Canali Testo</div>
                {channels.filter(c => c.type === "text").map(ch => (
                  <div
                    key={ch.id}
                    className={"ch-item" + (ch.id === activeChannel ? " active" : "")}
                    onClick={() => { setActiveChannel(ch.id); setShowSidebar(false); }}
                  >
                    <span style={{ fontSize: 16 }}>#</span> {ch.name}
                  </div>
                ))}
                {channels.some(c => c.type === "voice") && <>
                  <div style={{ padding: "10px 14px 4px", marginTop: 8, fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>Vocali</div>
                  {channels.filter(c => c.type === "voice").map(ch => (
                    <div key={ch.id} className="ch-item"><span>🔊</span> {ch.name}</div>
                  ))}
                </>}
              </>}
              {isVPS && (
                <div className="ch-item active" onClick={() => setShowSidebar(false)}>
                  <span>🖥️</span> pannello
                </div>
              )}
            </div>
            {/* Pannello utente in basso */}
            <div style={{
              padding: "10px 12px",
              background: "#232428",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
            }}>
              <Avatar letter={me.avatar} color={me.color} size={32} status={me.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
                <div style={{ fontSize: 10, color: STATUS_COLORS[me.status] }}>Online</div>
              </div>
              <div
                onClick={() => { setMe(null); setShowSidebar(false); }}
                style={{ fontSize: 18, cursor: "pointer", color: "#96989d", padding: "6px" }}
              >🚪</div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#313338", overflow: "hidden", width: "100%" }}>

          {/* Topbar */}
          <div style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0,
            minHeight: 54,
          }}>
            <button
              onClick={() => setShowSidebar(true)}
              style={{ background: "none", border: "none", color: "#dcddde", fontSize: 22, cursor: "pointer", padding: "4px 6px", lineHeight: 1 }}
            >☰</button>
            <span style={{ fontSize: 18, color: "#96989d" }}>{isVPS ? "🖥️" : "#"}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isVPS ? "pannello" : currentChannel?.name}
            </span>
            {!isVPS && onlineCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(35,165,90,0.15)", borderRadius: 20, padding: "5px 10px", flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#23a55a" }} />
                <span style={{ fontSize: 12, color: "#23a55a", fontWeight: 700 }}>{onlineCount}</span>
              </div>
            )}
            {!isVPS && (
              <button
                onClick={() => setShowMembers(v => !v)}
                style={{ background: showMembers ? "rgba(255,255,255,0.1)" : "none", border: "none", borderRadius: 8, padding: "7px 9px", cursor: "pointer", color: "#96989d", fontSize: 18 }}
              >👥</button>
            )}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {isVPS ? <VPSPanel /> : (
              <>
                {/* Messaggi */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 0", WebkitOverflowScrolling: "touch" }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#96989d", marginTop: 80 }}>
                      <div style={{ fontSize: 48 }}>💬</div>
                      <div style={{ marginTop: 12, fontSize: 17, fontWeight: 700, color: "#fff" }}>Inizio di #{currentChannel?.name}</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>Sii il primo a scrivere!</div>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const grouped = i > 0 && messages[i-1].author === msg.author;
                    return (
                      <div
                        key={msg.id}
                        className="msg-row"
                        style={{ padding: grouped ? "2px 14px 2px 62px" : "9px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}
                      >
                        {!grouped ? <Avatar letter={msg.avatar} color={msg.color} size={36} /> : <div style={{ width: 36 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {!grouped && (
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, color: msg.color, fontSize: 14 }}>{msg.author}</span>
                              <span style={{ fontSize: 11, color: "#72767d" }}>{msg.time}</span>
                            </div>
                          )}
                          <div style={{ fontSize: 14, color: "#dcddde", lineHeight: 1.55, wordBreak: "break-word" }}>{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Sidebar membri (si sovrappone su mobile) */}
                {showMembers && (
                  <div style={{ width: 200, background: "#2b2d31", overflowY: "auto", padding: "12px 0", flexShrink: 0, WebkitOverflowScrolling: "touch" }}>
                    <div style={{ padding: "4px 12px 8px", fontSize: 11, fontWeight: 700, color: "#23a55a", textTransform: "uppercase", letterSpacing: 1 }}>🟢 {onlineCount} online</div>
                    {["Owner","Admin","Member"].map(role => {
                      const group = members.filter(m => m.role === role);
                      if (!group.length) return null;
                      return (
                        <div key={role}>
                          <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>{role} — {group.length}</div>
                          {group.map(m => (
                            <div key={m.id} style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, borderRadius: 6, margin: "1px 6px", minHeight: 44 }}>
                              <Avatar letter={m.avatar} color={m.color} size={30} status={m.status} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: m.status === "offline" ? "#72767d" : "#dcddde" }}>{m.name}</div>
                                <div style={{ fontSize: 10, color: STATUS_COLORS[m.status] }}>{m.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input messaggio */}
          {!isVPS && (
            <div style={{
              padding: "0 12px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              flexShrink: 0,
              background: "#313338",
            }}>
              <div style={{ background: "#383a40", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px" }}>
                <span style={{ color: "#96989d", fontSize: 20, paddingRight: 10, paddingTop: 12, paddingBottom: 12 }}>+</span>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={"Scrivi in #" + (currentChannel?.name || "")}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: "#dcddde",
                    fontSize: 15,
                    padding: "14px 0",
                    fontFamily: "inherit",
                  }}
                />
                <span
                  onClick={sendMessage}
                  style={{ cursor: "pointer", fontSize: 20, paddingLeft: 10, color: input.trim() ? "#5865f2" : "#4f545c", transition: "color 0.15s" }}
                >➤</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crea server */}
      {showAddServer && (
        <div
          onClick={() => setShowAddServer(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#313338", borderRadius: 20, padding: "30px 24px", width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Crea un Server</div>
            <div style={{ fontSize: 13, color: "#96989d", marginBottom: 20 }}>Il tuo spazio per te e i tuoi amici.</div>
            <input
              value={newServerName}
              onChange={e => setNewServerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addServer()}
              placeholder="Nome del server"
              autoFocus
              style={{ width: "100%", background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 16px", color: "#fff", fontSize: 15, fontFamily: "inherit", marginBottom: 18 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddServer(false)}
                style={{ background: "transparent", border: "none", color: "#96989d", padding: "12px 18px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "inherit", minHeight: 44 }}
              >Annulla</button>
              <button
                onClick={addServer}
                style={{ background: "#5865f2", border: "none", color: "#fff", padding: "12px 22px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", minHeight: 44 }}
              >Crea</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
