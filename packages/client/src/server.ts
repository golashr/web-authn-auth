import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "@scope/config";

const app = new Application();

// Serve static files
app.use(async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/public`,
    index: "index.html",
  });
});

const port = config.clientPort;
const rpId = config.rpId;
console.log(`Static server running on http://${rpId}:${port}`);
await app.listen({ port });
