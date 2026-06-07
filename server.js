// server.js — mettilo in /root/discord-clone/server.js
// npm install ws node-pty express cors
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const pty = require("node-pty");

const API_TOKEN = "cambia_questo_token_segreto"; // stesso token del frontend

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.get("/ping", (req, res) => res.json({ ok: true }));

wss.on("connection", (ws, req) => {
  // Autenticazione via query param: ws://IP:8081?token=XXX
  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");
  if (token !== API_TOKEN) {
    ws.send("\r\n\x1b[31mAccesso negato.\x1b[0m\r\n");
    ws.close();
    return;
  }

  // Avvia una shell bash
  const shell = pty.spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: "/root",
    env: process.env,
  });

  // VPS → client
  shell.onData((data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });

  // Client → VPS
  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === "resize") {
        shell.resize(parsed.cols, parsed.rows);
      } else if (parsed.type === "input") {
        shell.write(parsed.data);
      }
    } catch {
      shell.write(msg.toString());
    }
  });

  ws.on("close", () => shell.kill());
  shell.onExit(() => ws.close());
});

const PORT = 8082;
server.listen(PORT, () => console.log(`Terminal WS in ascolto su :${PORT}`));

