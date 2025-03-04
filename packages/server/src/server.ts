import {
  Application,
  type Context,
  Router,
} from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "@scope/config";
import type {
  ApiResponse,
  ErrorResponse,
  WelcomeResponse,
} from "./types/types.ts";
import authRouter from "./routes/auth/index.ts";
import apiRouter from "./routes/api/index.ts";
import { cors } from "./middleware/cors.ts";

const app = new Application();
const router = new Router();

// Add CORS middleware first
app.use(cors);

// Basic logging middleware
app.use(async (ctx: Context, next: () => Promise<unknown>) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

// Routes
router.get("/", (ctx: Context) => {
  const response: ApiResponse<WelcomeResponse> = {
    success: true,
    data: {
      message: "Welcome to Deno API Server",
    },
  };
  ctx.response.body = response;
});

// Add this before the existing routes
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Apply router middleware
app.use(router.routes());
app.use(router.allowedMethods());

// Error handling
app.use((ctx: Context) => {
  ctx.response.status = 404;
  const response: ApiResponse<ErrorResponse> = {
    success: false,
    data: { message: "Not Found" },
    error: "Requested resource not found",
  };
  ctx.response.body = response;
});

// Start the server
const rpId = config.rpId;
const port = config.serverPort;
console.log(`Server running on http://${rpId}:${port}`);
await app.listen({ port });
