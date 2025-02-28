export interface Config {
  serverPort: number;
  clientPort: number;
  env: string;
  rpId: string;
  rpName: string;
  origin: string;
  redis: {
    host: string;
    port: number;
  };
}

export const config: Config = {
  serverPort: Number(Deno.env.get("BACKEND_SERVER_PORT")) || 3126,
  clientPort: Number(Deno.env.get("CLIENT_SERVER_PORT")) || 8000,
  env: Deno.env.get("DENO_ENV") || "development",
  rpId: Deno.env.get("RP_ID") || "localhost",
  rpName: Deno.env.get("RP_NAME") || "Deno WebAuthn Demo",
  origin: Deno.env.get("ORIGIN") || "http://localhost:8000",
  redis: {
    host: Deno.env.get("REDIS_HOST") || "localhost",
    port: Number(Deno.env.get("REDIS_PORT")) || 7379,
  },
}; 