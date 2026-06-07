import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// ─── Firebase ───────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDkzSSr-7iTTds-Bdl-cGqDVld4NoM5FyA",
  authDomain: "app333-eb308.firebaseapp.com",
  projectId: "app333-eb308",
  storageBucket: "app333-eb308.firebasestorage.app",
  messagingSenderId: "376156573506",
  appId: "1:376156573506:web:a5b3aecb1d841c556442db",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

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
    <button onClick={handle} disabled={loading} style={{ background: loading ? "#4f545c" : color, border: "none", borderRadius: 8, padding: small ? "5px 12px" : "8px 16px", color: "#fff", fontSize: small ? 11 : 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
      {loading ? "..." : label}
    </button>
  );
}

function StatusBadge({ status }) {
  const colors = { active: "#23a55a", inactive: "#f23f43", online: "#23a55a", stopped: "#f23f43", errored: "#f0b232" };
  const c = colors[status] || "#96989d";
  return <span style={{ background: c + "22", color: c, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{status}</span>;
}

function Gauge({ label, value, max, unit = "", color = "#5865f2" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const c = pct > 85 ? "#f23f43" : pct > 60 ? "#f0b232" : color;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, color: "#dcddde" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{value}{unit} / {max}{unit}</span>
      </div>
      <div style={{ height: 8, background: "#1e1f22", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: c, borderRadius: 10, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible", callback: () => {} });
    }
  }, []);

  const sendOTP = async () => {
    setError("");
    if (!phone.trim()) { setError("Inserisci il numero"); return; }
    let number = phone.trim();
    if (!number.startsWith("+")) number = "+39" + number.replace(/^0/, "");
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, number, window.recaptchaVerifier);
      setConfirm(result); setStep("otp");
    } catch (e) {
      setError("Errore: " + (e.message || "numero non valido"));
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    setError("");
    if (!otp.trim()) { setError("Inserisci il codice OTP"); return; }
    setLoading(true);
    try {
      const result = await confirm.confirm(otp);
      const user = result.user;
      const name = user.displayName || "User" + user.uid.slice(0, 4);
      onLogin({ name, avatar: name[0].toUpperCase(), color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], status: "online", phone: user.phoneNumber });
    } catch { setError("Codice OTP non valido"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1e1f22", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Syne', sans-serif" }}>
      <div id="recaptcha-container" />
      <div style={{ background: "#2b2d31", borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🩸</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>BLD BLOOD</div>
          <div style={{ fontSize: 14, color: "#96989d", marginTop: 6 }}>
            {step === "phone" ? "Accedi con il tuo numero" : "Controlla gli SMS"}
          </div>
        </div>

        {step === "phone" ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#96989d", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Numero di telefono</div>
            <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && sendOTP()}
              placeholder="+39 333 1234567"
              style={{ width: "100%", background: "#1e1f22", border: "2px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", color: "#fff", fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: "#96989d", marginBottom: 16 }}>Prefisso +39 aggiunto automaticamente</div>
            {error && <div style={{ color: "#f23f43", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={sendOTP} disabled={loading} style={{ width: "100%", background: loading ? "#4f545c" : "#c0392b", border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? "Invio..." : "Invia codice SMS"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#96989d", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Codice OTP</div>
            <input value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === "Enter" && verifyOTP()}
              placeholder="123456" maxLength={6}
              style={{ width: "100%", background: "#1e1f22", border: "2px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", color: "#fff", fontSize: 28, fontFamily: "monospace", outline: "none", letterSpacing: 10, textAlign: "center", marginBottom: 16 }} />
            {error && <div style={{ color: "#f23f43", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={verifyOTP} disabled={loading} style={{ width: "100%", background: loading ? "#4f545c" : "#23a55a", border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              {loading ? "Verifica..." : "Conferma codice"}
            </button>
            <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, color: "#96989d", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              ← Cambia numero
            </button>
          </>
        )}
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
    <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#313338" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>🖥️ VPS Manager</div>
          <div style={{ fontSize: 11, color: "#96989d" }}>Controllo completo della VPS</div>
        </div>
        <div onClick={() => setAutoRefresh(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "#2b2d31", borderRadius: 20, padding: "5px 12px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? "#23a55a" : "#96989d" }} />
          <span style={{ fontSize: 11, color: "#96989d" }}>{autoRefresh ? "Live 10s" : "Pausa"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "#5865f2" : "#2b2d31", border: "none", borderRadius: 10, padding: "8px 14px", color: tab === t.id ? "#fff" : "#96989d", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
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
              <div style={{ fontSize: 13, color: "#96989d", marginTop: 6 }}>⏱ Uptime: {status.uptime}</div>
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
            <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#fff", fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
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
            <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <StatusBadge status={p.status} />
                    <span style={{ fontSize: 11, color: "#96989d" }}>CPU: {p.cpu}%</span>
                    <span style={{ fontSize: 11, color: "#96989d" }}>RAM: {p.memory}MB</span>
                    <span style={{ fontSize: 11, color: "#96989d" }}>Restart: {p.restarts}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
            <span onClick={() => setLog("")} style={{ fontSize: 12, color: "#96989d", cursor: "pointer" }}>✕</span>
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
  };

  const allServers = [...data.servers, { id: VPS_SERVER_ID, name: "VPS Manager", icon: "🖥️", color: "#2ecc71" }];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1e1f22; color: #dcddde; font-family: 'Syne', sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 3px; }
        input { outline: none; }
        .msg-row:hover { background: rgba(255,255,255,0.03); }
        .ch-item { padding: 7px 12px; cursor: pointer; color: #96989d; font-size: 14px; display: flex; align-items: center; gap: 6px; border-radius: 6px; margin: 1px 8px; transition: all 0.15s; }
        .ch-item:hover { background: rgba(255,255,255,0.06); color: #dcddde; }
        .ch-item.active { background: rgba(255,255,255,0.1); color: #fff; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* Mobile overlay */}
        {showSidebar && <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} />}

        {/* Sidebar */}
        <div style={{ display: "flex", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 60, transform: showSidebar ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease" }}>
          {/* Server icons */}
          <div style={{ width: 62, background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", overflowY: "auto" }}>
            {allServers.map(s => (
              <div key={s.id} onClick={() => switchServer(s.id)} style={{ position: "relative", cursor: "pointer", marginBottom: 8 }}>
                <div style={{ position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)", width: 4, height: s.id === activeServer ? 36 : 8, background: "#fff", borderRadius: "0 4px 4px 0", transition: "height 0.2s" }} />
                <div style={{ width: 44, height: 44, borderRadius: s.id === activeServer ? 14 : 22, background: s.id === activeServer ? s.color : "#36393f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s", boxShadow: s.id === activeServer ? "0 0 0 2px " + s.color : "none" }}>
                  {s.icon}
                </div>
              </div>
            ))}
            <div style={{ width: 28, height: 1, background: "#36393f", margin: "8px 0" }} />
            <div onClick={() => setShowAddServer(true)} style={{ width: 44, height: 44, borderRadius: 22, background: "#36393f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#23a55a", cursor: "pointer" }}>+</div>
          </div>

          {/* Channels */}
          <div style={{ width: 210, background: "#2b2d31", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: currentServer?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{currentServer?.icon}</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentServer?.name}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {!isVPS && <>
                <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>Canali Testo</div>
                {channels.filter(c => c.type === "text").map(ch => (
                  <div key={ch.id} className={"ch-item" + (ch.id === activeChannel ? " active" : "")} onClick={() => { setActiveChannel(ch.id); setShowSidebar(false); }}>
                    <span>#</span> {ch.name}
                  </div>
                ))}
                {channels.some(c => c.type === "voice") && <>
                  <div style={{ padding: "8px 12px 4px", marginTop: 8, fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>Vocali</div>
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
            {/* User panel */}
            <div style={{ padding: "8px 10px", background: "#232428", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Avatar letter={me.avatar} color={me.color} size={30} status={me.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
                <div style={{ fontSize: 10, color: STATUS_COLORS[me.status] }}>Online</div>
              </div>
              <div onClick={() => { auth.signOut(); setMe(null); }} style={{ fontSize: 14, cursor: "pointer", color: "#96989d" }}>🚪</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#313338" }}>
          {/* Topbar */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
            <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", color: "#dcddde", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>☰</button>
            <span style={{ fontSize: 18, color: "#96989d" }}>{isVPS ? "🖥️" : "#"}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", flex: 1 }}>{isVPS ? "pannello" : currentChannel?.name}</span>
            {!isVPS && onlineCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(35,165,90,0.15)", borderRadius: 20, padding: "4px 10px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#23a55a" }} />
                <span style={{ fontSize: 12, color: "#23a55a", fontWeight: 700 }}>{onlineCount} online</span>
              </div>
            )}
            {!isVPS && (
              <button onClick={() => setShowMembers(v => !v)} style={{ background: showMembers ? "rgba(255,255,255,0.1)" : "none", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#96989d", fontSize: 16 }}>👥</button>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {isVPS ? <VPSPanel /> : (
              <>
                {/* Chat messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#96989d", marginTop: 60 }}>
                      <div style={{ fontSize: 44 }}>💬</div>
                      <div style={{ marginTop: 10, fontSize: 17, fontWeight: 700, color: "#fff" }}>Inizio di #{currentChannel?.name}</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Sii il primo a scrivere!</div>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const grouped = i > 0 && messages[i-1].author === msg.author;
                    return (
                      <div key={msg.id} className="msg-row" style={{ padding: grouped ? "1px 14px 1px 60px" : "8px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        {!grouped ? <Avatar letter={msg.avatar} color={msg.color} size={34} /> : <div style={{ width: 34 }} />}
                        <div style={{ flex: 1 }}>
                          {!grouped && (
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, color: msg.color, fontSize: 14 }}>{msg.author}</span>
                              <span style={{ fontSize: 11, color: "#72767d" }}>{msg.time}</span>
                            </div>
                          )}
                          <div style={{ fontSize: 14, color: "#dcddde", lineHeight: 1.5, wordBreak: "break-word" }}>{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Members sidebar */}
                {showMembers && (
                  <div style={{ width: 190, background: "#2b2d31", overflowY: "auto", padding: "12px 0", flexShrink: 0 }}>
                    <div style={{ padding: "4px 12px 8px", fontSize: 11, fontWeight: 700, color: "#23a55a", textTransform: "uppercase", letterSpacing: 1 }}>🟢 {onlineCount} online</div>
                    {["Owner","Admin","Member"].map(role => {
                      const group = members.filter(m => m.role === role);
                      if (!group.length) return null;
                      return (
                        <div key={role}>
                          <div style={{ padding: "6px 12px 3px", fontSize: 10, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>{role} — {group.length}</div>
                          {group.map(m => (
                            <div key={m.id} style={{ padding: "5px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 6, margin: "1px 6px" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <Avatar letter={m.avatar} color={m.color} size={28} status={m.status} />
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

          {/* Input (solo chat) */}
          {!isVPS && (
            <div style={{ padding: "0 12px 12px", flexShrink: 0 }}>
              <div style={{ background: "#383a40", borderRadius: 10, display: "flex", alignItems: "center", padding: "0 12px" }}>
                <span style={{ color: "#96989d", fontSize: 18, padding: "10px 8px 10px 0" }}>+</span>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={"Scrivi in #" + (currentChannel?.name || "")}
                  style={{ flex: 1, background: "transparent", border: "none", color: "#dcddde", fontSize: 14, padding: "12px 0", fontFamily: "inherit" }} />
                <span onClick={sendMessage} style={{ cursor: "pointer", fontSize: 18, padding: "10px 0 10px 8px", color: input.trim() ? "#5865f2" : "#4f545c" }}>➤</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Server Modal */}
      {showAddServer && (
        <div onClick={() => setShowAddServer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#313338", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Crea un Server</div>
            <div style={{ fontSize: 13, color: "#96989d", marginBottom: 20 }}>Il tuo spazio per te e i tuoi amici.</div>
            <input value={newServerName} onChange={e => setNewServerName(e.target.value)} onKeyDown={e => e.key === "Enter" && addServer()}
              placeholder="Nome del server" autoFocus
              style={{ width: "100%", background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddServer(false)} style={{ background: "transparent", border: "none", color: "#96989d", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>Annulla</button>
              <button onClick={addServer} style={{ background: "#5865f2", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Crea</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
