import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ApiResponse } from "../../types/types.ts";
import { WebAuthnService } from "../../services/index.ts";

export async function generateAuthChallenge(ctx: Context) {
  try {
    const challengeData = await WebAuthnService.generateAuthChallenge();

    ctx.response.body = {
      success: true,
      data: challengeData,
    } as ApiResponse<{ challenge: string; challengeId: string }>;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}
