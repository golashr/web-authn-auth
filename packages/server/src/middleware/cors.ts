import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export async function cors(ctx: Context, next: () => Promise<unknown>) {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // Allow credentials if needed
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");

  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

   // Handle preflight requests
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
} 