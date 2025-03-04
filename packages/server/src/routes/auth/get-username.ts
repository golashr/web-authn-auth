import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ApiResponse } from "../../types/types.ts";
import { WebAuthnService } from "../../services/index.ts";

export async function getUsernameFromCredential(ctx: Context) {
  const body = await ctx.request.body().value;
  const { passkeyId } = body;

  try {
    const username = await WebAuthnService.getUsernameFromCredentialId(passkeyId);
    ctx.response.body = {
      success: true,
      data: { username }
    } as ApiResponse<{ username: string }>;
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null
    };
  }
} 