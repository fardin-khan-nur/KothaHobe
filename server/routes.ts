import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Stats Endpoint
  app.get(api.stats.get.path, async (req, res) => {
    const totalMatches = await storage.getTotalMatches();
    const activeUsers = wss.clients.size;
    res.json({ activeUsers, totalMatches });
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Simple in-memory queue and partner mapping
  let waitingClient: WebSocket | null = null;
  const partners = new Map<WebSocket, WebSocket>();

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case WS_EVENTS.JOIN_QUEUE:
            handleJoinQueue(ws);
            break;

          case WS_EVENTS.LEAVE_QUEUE:
            handleLeaveQueue(ws);
            break;

          case WS_EVENTS.SIGNAL:
            handleSignal(ws, message.payload);
            break;
          
          case WS_EVENTS.MESSAGE:
            handleChatMessage(ws, message.payload);
            break;
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      handleDisconnect(ws);
    });
  });

  function handleJoinQueue(ws: WebSocket) {
    // If already in a call, ignore
    if (partners.has(ws)) return;

    // If this specific client is already waiting, ignore
    if (waitingClient === ws) return;

    if (waitingClient && waitingClient.readyState === WebSocket.OPEN) {
      // Match found!
      const partner = waitingClient;
      waitingClient = null;

      partners.set(ws, partner);
      partners.set(partner, ws);

      // Notify both
      ws.send(JSON.stringify({ type: WS_EVENTS.MATCHED, initiator: true }));
      partner.send(JSON.stringify({ type: WS_EVENTS.MATCHED, initiator: false }));

      // Record match (optional async)
      storage.createMatch({ duration: 0 }); // Placeholder duration
    } else {
      // Add to queue
      waitingClient = ws;
      // If previous waiting client disconnected, this one is now the waiter
    }
  }

  function handleLeaveQueue(ws: WebSocket) {
    if (waitingClient === ws) {
      waitingClient = null;
    }
    
    // If paired, treat as disconnect
    handleDisconnect(ws);
  }

  function handleDisconnect(ws: WebSocket) {
    if (waitingClient === ws) {
      waitingClient = null;
    }

    const partner = partners.get(ws);
    if (partner) {
      partners.delete(ws);
      partners.delete(partner);

      if (partner.readyState === WebSocket.OPEN) {
        partner.send(JSON.stringify({ type: WS_EVENTS.PARTNER_DISCONNECTED }));
      }
    }
  }

  function handleSignal(ws: WebSocket, payload: any) {
    const partner = partners.get(ws);
    if (partner && partner.readyState === WebSocket.OPEN) {
      partner.send(JSON.stringify({
        type: WS_EVENTS.SIGNAL,
        payload: payload
      }));
    }
  }

  function handleChatMessage(ws: WebSocket, payload: any) {
    const partner = partners.get(ws);
    if (partner && partner.readyState === WebSocket.OPEN) {
      partner.send(JSON.stringify({
        type: WS_EVENTS.MESSAGE,
        payload: payload
      }));
    }
  }

  return httpServer;
}
