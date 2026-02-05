import { z } from 'zod';
import { insertMatchSchema, matches } from './schema';

export const api = {
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          activeUsers: z.number(),
          totalMatches: z.number(),
        }),
      },
    },
  },
};

// Types for WebSocket payloads
export const wsMessages = {
  signal: z.object({
    type: z.enum(['offer', 'answer', 'candidate']),
    target: z.string(), // partner socket id
    payload: z.any(),
  }),
  chat: z.object({
    text: z.string(),
  }),
};

export type StatsResponse = z.infer<typeof api.stats.get.responses[200]>;
