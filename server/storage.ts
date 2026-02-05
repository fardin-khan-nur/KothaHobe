import { db } from "./db.js";
import { matches, type InsertMatch } from "../shared/schema.js";
import { count } from "drizzle-orm";

export interface IStorage {
  createMatch(match: InsertMatch): Promise<void>;
  getTotalMatches(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createMatch(match: InsertMatch): Promise<void> {
    await db.insert(matches).values(match);
  }

  async getTotalMatches(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(matches);
    return result.count;
  }
}

export const storage = new DatabaseStorage();
