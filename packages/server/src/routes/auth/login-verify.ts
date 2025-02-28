import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ApiResponse } from "../../types/types.ts";
import { WebAuthnService } from "../../services/index.ts";

export async function loginVerify(ctx: Context) {
  const body = await ctx.request.body().value;
  const { username, response } = body;

  try {
    const verified = await WebAuthnService.verifyAuthentication(username, response);
    ctx.response.body = {
      success: true,
      data: { verified }
    } as ApiResponse<{ verified: boolean }>;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null
    };
  }
};