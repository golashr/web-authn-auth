import { connect, type Redis } from "https://deno.land/x/redis@v0.31.0/mod.ts";
import type { User } from "../types/webauthn.ts";
import { config } from "@scope/config";

export class RedisService {
  private static instance: RedisService;
  private client: Redis;

  private constructor() {
    // Initialize as a promise to be resolved in connect()
    this.client = {} as Redis;
  }

  public static async getInstance(): Promise<RedisService> {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
      await RedisService.instance.connect();
    }
    return RedisService.instance;
  }

  private async connect(): Promise<void> {
    this.client = await connect({
      hostname: config.redis.host,
      port: config.redis.port,
    });
  }

  async setUser(username: string, user: User): Promise<void> {
    await this.client.set(
      `user:${username}`,
      JSON.stringify(user)
    );
  }

  async getUser(username: string): Promise<User | null> {
    const userData = await this.client.get(`user:${username}`);
    if (!userData) return null;
    return JSON.parse(userData) as User;
  }

  async deleteUser(username: string): Promise<void> {
    await this.client.del(`user:${username}`);
  }

  async getAllUsers(): Promise<User[]> {
    const keys = await this.client.keys("user:*");
    const users: User[] = [];
    
    for (const key of keys) {
      const userData = await this.client.get(key);
      if (userData) {
        users.push(JSON.parse(userData));
      }
    }
    
    return users;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
} 