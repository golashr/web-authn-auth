import { connect, type Redis } from "https://deno.land/x/redis@v0.31.0/mod.ts";
import type { Passkey, User } from "../types/webauthn.ts";
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

  async setUserByName(userName: string, user: User): Promise<void> {
    await this.client.set(
      `user:${userName}`,
      JSON.stringify(user),
    );
  }

  async getUserByName(userName: string): Promise<User | null> {
    const userData = await this.client.get(`user:${userName}`);
    if (!userData) return null;
    return JSON.parse(userData) as User;
  }

  async getUserByPasskeyId(
    passkeyId: string,
  ): Promise<{ user: User; passKey: Passkey } | null> {
    // Get all users
    const users = await this.getAllUsers();
    // Find user that has the matching passkey ID
    const user = users.find((user) =>
      user.userPasskeys.some((passkey) => passkey.id === passkeyId)
    );
    const matchingPasskey = user?.userPasskeys.find((passkey) =>
      passkey.id === passkeyId
    );
    return user && matchingPasskey ? { user, passKey: matchingPasskey } : null;
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

  async setChallengeSignUp(
    challenge: string,
    userName: string,
    expirySeconds = 300,
  ): Promise<void> {
    await this.client.set(`challenge:signup:${challenge}`, userName, {
      ex: expirySeconds, // 5 minutes default expiry
    });
  }

  async getChallengeSignUp(challenge: string): Promise<string | null> {
    return await this.client.get(`challenge:signup:${challenge}`);
  }

  async setChallengeAuth(
    challengeId: string,
    challenge: string,
    expirySeconds = 300,
  ): Promise<void> {
    await this.client.set(`challenge:auth:${challengeId}`, challenge, {
      ex: expirySeconds, // 5 minutes default expiry
    });
  }

  async getChallengeAuth(challengeId: string): Promise<string | null> {
    return await this.client.get(`challenge:auth:${challengeId}`);
  }
}
