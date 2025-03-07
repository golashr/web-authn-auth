import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { GenerateRegistrationOptionsOpts } from "@simplewebauthn/server";
import type { ApiResponse } from "../../types/types.ts";
import { WebAuthnService } from "../../services/index.ts";

export async function registerOptions(ctx: Context) {
  const body = await ctx.request.body().value;
  const { username } = body;

  try {
    const options = await WebAuthnService.generateRegistrationOptions(username);
    ctx.response.body = {
      success: true,
      data: options,
    } as ApiResponse<GenerateRegistrationOptionsOpts>;
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    } as ApiResponse<null>;
  }
}
