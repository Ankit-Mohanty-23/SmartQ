import { WebSocketServer } from "ws";

let wss = null;
const rooms = new Map();

export function init(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      try {
        const { event, doctorId } = JSON.parse(raw);

        if (event === "join" && doctorId) {
          if (!rooms.has(doctorId)) rooms.set(doctorId, new Set());
          rooms.get(doctorId).add(ws);
          ws._doctorId = doctorId;
        }
      } catch {
        console.error("[WebSocketService] Invalid message received");
      }
    });

    ws.on("close", () => {
      if (ws._doctorId && rooms.has(ws._doctorId)) {
        rooms.get(ws._doctorId).delete(ws);
        if (rooms.get(ws._doctorId).size === 0) rooms.delete(ws._doctorId);
      }
    });

    ws.on("error", (err) =>
      console.error("[WebSocketService] Client error:", err),
    );
  });
}

export function emit(eventType, payload) {
  if (!wss) {
    console.warn("[WebSocketService] emit called before init");
    return;
  }

  const message = JSON.stringify({ event: eventType, data: payload });
  const { doctorId } = payload;

  if (doctorId && rooms.has(doctorId)) {
    rooms.get(doctorId).forEach((client) => {
      if (client.readyState === 1) client.send(message);
    });
  } else {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(message);
    });
  }
}
