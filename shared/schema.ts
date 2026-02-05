import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  duration: integer("duration"), // in seconds
  endedAt: timestamp("ended_at").defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, endedAt: true });

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// WebSocket Message Types
export const WS_EVENTS = {
  // Client -> Server
  JOIN_QUEUE: 'join_queue',
  LEAVE_QUEUE: 'leave_queue',
  SIGNAL: 'signal', // offer, answer, ice-candidate
  MESSAGE: 'message', // text chat

  // Server -> Client
  MATCHED: 'matched',
  PARTNER_DISCONNECTED: 'partner_disconnected',
  ERROR: 'error',
} as const;

export interface SignalData {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
}

export interface ChatMessage {
  text: string;
  timestamp: number;
  isSelf: boolean;
}
