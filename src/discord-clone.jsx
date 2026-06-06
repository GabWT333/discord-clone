import { useState, useRef, useEffect } from "react";

const INITIAL_DATA = {
  servers: [
    { id: 1, name: "BLD BLOOD", icon: "🩸", color: "#c0392b" },
    { id: 2, name: "Gaming Hub", icon: "🎮", color: "#8e44ad" },
    { id: 3, name: "Dev Zone", icon: "⚙️", color: "#2980b9" },
  ],
  channels: {
    1: [
      { id: 101, name: "generale", type: "text" },
      { id: 102, name: "annunci", type: "text" },
      { id: 103, name: "bot-test", type: "text" },
      { id: 104, name: "vocale-1", type: "voice" },
    ],
    2: [
      { id: 201, name: "generale", type: "text" },
      { id: 202, name: "fps", type: "text" },
      { id: 203, name: "rpg", type: "text" },
    ],
    3: [
      { id: 301, name: "generale", type: "text" },
      { id: 302, name: "javascript", type: "text" },
      { id: 303, name: "python", type: "text" },
    ],
  },
  messages: {
    101: [
      { id: 1, author: "Gab", avatar: "G", color: "#e74c3c", content: "Benvenuti nel server BLD BLOOD 🩸", time: "Oggi alle 10:00" },
      { id: 2, author: "Lucifero", avatar: "L", color: "#8e44ad", content: "Pronto per il bot!", time: "Oggi alle 10:02" },
    ],
    102: [
      { id: 1, author: "Gab", avatar: "G", color: "#e74c3c", content: "📢 Prima release del bot disponibile!", time: "Oggi alle 09:00" },
    ],
    103: [],
    201: [{ id: 1, author: "System", avatar: "S", color: "#27ae60", content: "Canale creato.", time: "Oggi alle 08:00" }],
    202: [],
    203: [],
    301: [],
    302: [{ id: 1, author: "System", avatar: "S", color: "#27ae60", content: "Canale JS aperto.", time: "Oggi alle 08:00" }],
    303: [],
  },
  members: {
    1: [
      { id: 1, name: "Gab", status: "online", role: "Owner", avatar: "G", color: "#e74c3c" },
      { id: 2, name: "Lucifero", status: "online", role: "Admin", avatar: "L", color: "#8e44ad" },
      { id: 3, name: "333staff", status: "idle", role: "Member", avatar: "3", color: "#f39c12" },
    ],
    2: [
      { id: 1, name: "Gab", status: "online", role: "Owner", avatar: "G", color: "#e74c3c" },
      { id: 4, name: "Player1", status: "dnd", role: "Member", avatar: "P", color: "#16a085" },
    ],
    3: [
      { id: 1, name: "Gab", status: "online", role: "Owner", avatar: "G", color: "#e74c3c" },
      { id: 5, name: "DevUser", status: "offline", role: "Member", avatar: "D", color: "#7f8c8d" },
    ],
  },
};

const STATUS_COLORS = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" };
const STATUS_LABELS = { online: "Online", idle: "Assente", dnd: "Non disturbare", offline: "Offline" };

function Avatar({ letter, color, size = 36, status }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: status !== undefined ? "50%" : 12,
        background: color, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif",
      }}>
        {letter}
      </div>
      {status !== undefined && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.32, height: size * 0.32,
          borderRadius: "50%", background: STATUS_COLORS[status],
          border: "2px solid #1e1f22",
        }} />
      )}
    </div>
  );
}

function ServerIcon({ server, active, onClick }) {
  return (
    <div onClick={onClick} style={{ position: "relative", cursor: "pointer", marginBottom: 8 }}>
      <div style={{
        position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)",
        width: 4, height: active ? 36 : 8, background: "#fff",
        borderRadius: "0 4px 4px 0", transition: "height 0.2s ease",
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: active ? 16 : 24,
        background: active ? server.color : "#36393f",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, transition: "all 0.2s ease",
        boxShadow: active ? `0 0 0 2px ${server.color}` : "none",
      }}>
        {server.icon}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeServer, setActiveServer] = useState(1);
  const [activeChannel, setActiveChannel] = useState(101);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [me] = useState({ name: "Gab", avatar: "G", color: "#e74c3c", status: "online" });
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel, data.messages]);

  const currentServer = data.servers.find(s => s.id === activeServer);
  const channels = data.channels[activeServer] || [];
  const messages = data.messages[activeChannel] || [];
  const members = data.members[activeServer] || [];
  const currentChannel = channels.find(c => c.id === activeChannel);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      author: me.name, avatar: me.avatar, color: me.color,
      content: input.trim(),
      time: `Oggi alle ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}`,
    };
    setData(prev => ({
      ...prev,
      messages: { ...prev.messages, [activeChannel]: [...(prev.messages[activeChannel] || []), newMsg] },
    }));
    setInput("");
  };

  const addServer = () => {
    if (!newServerName.trim()) return;
    const icons = ["🌟", "🔥", "💎", "🚀", "⚡", "🎯", "🌈"];
    const colors = ["#e74c3c", "#8e44ad", "#2980b9", "#27ae60", "#f39c12", "#16a085"];
    const newId = Date.now();
    const newChannelId = newId + 1;
    setData(prev => ({
      ...prev,
      servers: [...prev.servers, {
        id: newId, name: newServerName.trim(),
        icon: icons[Math.floor(Math.random() * icons.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      }],
      channels: { ...prev.channels, [newId]: [{ id: newChannelId, name: "generale", type: "text" }] },
      messages: { ...prev.messages, [newChannelId]: [] },
      members: { ...prev.members, [newId]: [{ id: 1, name: me.name, status: "online", role: "Owner", avatar: me.avatar, color: me.color }] },
    }));
    setActiveServer(newId);
    setActiveChannel(newChannelId);
    setNewServerName("");
    setShowAddServer(false);
  };

  const filteredMessages = search
    ? messages.filter(m => m.content.toLowerCase().includes(search.toLowerCase()))
    : messages;

  const roleGroups = ["Owner", "Admin", "Member"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1e1f22; color: #dcddde; font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 3px; }
        input { outline: none; }
        .msg-row:hover { background: rgba(255,255,255,0.03); }
        .channel-item:hover { background: rgba(255,255,255,0.06); color: #dcddde !important; }
        .channel-item.active { background: rgba(255,255,255,0.1); color: #fff !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.1); }
        .server-add:hover div { background: #23a55a !important; border-radius: 16px !important; color: #fff !important; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* Server Sidebar */}
        <div style={{
          width: 72, background: "#1e1f22", display: "flex", flexDirection: "column",
          alignItems: "center", padding: "12px 0", gap: 0, overflowY: "auto",
        }}>
          {data.servers.map(s => (
            <ServerIcon key={s.id} server={s} active={s.id === activeServer}
              onClick={() => { setActiveServer(s.id); setActiveChannel(data.channels[s.id][0].id); }} />
          ))}
          <div style={{ width: 32, height: 1, background: "#36393f", margin: "8px 0" }} />
          <div className="server-add" onClick={() => setShowAddServer(true)} style={{ cursor: "pointer", marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24, background: "#36393f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#23a55a", transition: "all 0.2s ease",
            }}>+</div>
          </div>
        </div>

        {/* Channel Sidebar */}
        <div style={{ width: 240, background: "#2b2d31", display: "flex", flexDirection: "column" }}>
          {/* Server header */}
          <div style={{
            padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, rgba(255,255,255,0.04), transparent)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: currentServer?.color,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>{currentServer?.icon}</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{currentServer?.name}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>
              Canali Testo
            </div>
            {channels.filter(c => c.type === "text").map(ch => (
              <div key={ch.id} className={`channel-item ${ch.id === activeChannel ? "active" : ""}`}
                onClick={() => setActiveChannel(ch.id)}
                style={{
                  padding: "6px 16px", cursor: "pointer", color: ch.id === activeChannel ? "#fff" : "#96989d",
                  fontSize: 14, display: "flex", alignItems: "center", gap: 6, borderRadius: 6, margin: "1px 8px",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 16 }}>#</span> {ch.name}
              </div>
            ))}
            {channels.some(c => c.type === "voice") && (
              <div style={{ padding: "8px 12px 4px", marginTop: 8, fontSize: 11, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>
                Canali Vocali
              </div>
            )}
            {channels.filter(c => c.type === "voice").map(ch => (
              <div key={ch.id} className="channel-item"
                style={{
                  padding: "6px 16px", cursor: pointer, color: "#96989d",
                  fontSize: 14, display: "flex", alignItems: "center", gap: 6, borderRadius: 6, margin: "1px 8px",
                }}>
                <span style={{ fontSize: 14 }}>🔊</span> {ch.name}
              </div>
            ))}
          </div>

          {/* User panel */}
          <div style={{
            padding: "8px 12px", background: "#232428", display: "flex",
            alignItems: "center", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Avatar letter={me.avatar} color={me.color} size={32} status={me.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{me.name}</div>
              <div style={{ fontSize: 11, color: STATUS_COLORS[me.status] }}>{STATUS_LABELS[me.status]}</div>
            </div>
            <div style={{ fontSize: 16, cursor: "pointer", color: "#96989d" }}>⚙️</div>
          </div>
        </div>

        {/* Main Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#313338" }}>
          {/* Channel header */}
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,0.02)",
          }}>
            <span style={{ fontSize: 20, color: "#96989d" }}>#</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{currentChannel?.name}</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca..."
                style={{
                  background: "#1e1f22", border: "none", borderRadius: 6,
                  padding: "4px 10px", color: "#dcddde", fontSize: 13, width: 160,
                  fontFamily: "inherit",
                }} />
              <button className="icon-btn" onClick={() => setShowMembers(v => !v)}
                style={{
                  background: showMembers ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "none", borderRadius: 6, padding: "6px 8px",
                  cursor: "pointer", color: "#96989d", fontSize: 16,
                }}>👥</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
            {filteredMessages.length === 0 && (
              <div style={{ textAlign: "center", color: "#96989d", marginTop: 60 }}>
                <div style={{ fontSize: 48 }}>💬</div>
                <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: "#fff" }}>Inizio di #{currentChannel?.name}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>Sii il primo a scrivere qualcosa!</div>
              </div>
            )}
            {filteredMessages.map((msg, i) => {
              const prev = filteredMessages[i - 1];
              const grouped = prev && prev.author === msg.author;
              return (
                <div key={msg.id} className="msg-row" style={{
                  padding: grouped ? "1px 16px 1px 72px" : "8px 16px",
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  {!grouped ? (
                    <Avatar letter={msg.avatar} color={msg.color} size={36} />
                  ) : <div style={{ width: 36 }} />}
                  <div style={{ flex: 1 }}>
                    {!grouped && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: msg.color, fontSize: 14 }}>{msg.author}</span>
                        <span style={{ fontSize: 11, color: "#72767d" }}>{msg.time}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 14, color: "#dcddde", lineHeight: 1.5 }}>{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{
              background: "#383a40", borderRadius: 10, display: "flex",
              alignItems: "center", padding: "0 12px",
            }}>
              <span style={{ color: "#96989d", fontSize: 20, cursor: "pointer", padding: "10px 8px 10px 0" }}>+</span>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder={`Scrivi in #${currentChannel?.name}`}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#dcddde", fontSize: 14, padding: "12px 0",
                  fontFamily: "'Syne', sans-serif",
                }}
              />
              <span onClick={sendMessage} style={{
                cursor: "pointer", fontSize: 18, padding: "10px 0 10px 8px",
                color: input.trim() ? "#5865f2" : "#4f545c",
              }}>➤</span>
            </div>
          </div>
        </div>

        {/* Members sidebar */}
        {showMembers && (
          <div style={{ width: 240, background: "#2b2d31", overflowY: "auto", padding: "16px 0" }}>
            {roleGroups.map(role => {
              const group = members.filter(m => m.role === role);
              if (!group.length) return null;
              return (
                <div key={role}>
                  <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, color: "#96989d", textTransform: "uppercase", letterSpacing: 1 }}>
                    {role} — {group.length}
                  </div>
                  {group.map(m => (
                    <div key={m.id} style={{
                      padding: "6px 16px", display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer", borderRadius: 6, margin: "1px 8px",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Avatar letter={m.avatar} color={m.color} size={32} status={m.status} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: m.status === "offline" ? "#72767d" : "#dcddde" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: STATUS_COLORS[m.status] }}>{STATUS_LABELS[m.status]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Server Modal */}
      {showAddServer && (
        <div onClick={() => setShowAddServer(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#313338", borderRadius: 16, padding: 32, width: 440,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Crea un Server</div>
            <div style={{ fontSize: 14, color: "#96989d", marginBottom: 24 }}>
              Il tuo server è il posto dove tu e i tuoi amici vi ritrovate.
            </div>
            <input
              value={newServerName}
              onChange={e => setNewServerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addServer()}
              placeholder="Nome del server"
              autoFocus
              style={{
                width: "100%", background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: 14,
                fontFamily: "inherit", marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddServer(false)} style={{
                background: "transparent", border: "none", color: "#96989d",
                padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "inherit",
              }}>Annulla</button>
              <button onClick={addServer} style={{
                background: "#5865f2", border: "none", color: "#fff",
                padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              }}>Crea</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
