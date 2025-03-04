import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export async function cors(ctx: Context, next: () => Promise<unknown>) {
  // Get the origin from the request
  const origin = ctx.request.headers.get("Origin") || "http://localhost:8000";

  // Set CORS headers
  ctx.response.headers.set("Access-Control-Allow-Origin", origin);
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Origin");
  ctx.response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204; // No content
    return;
  }

  await next();
} 