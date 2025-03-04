import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { registerOptions } from "./register-options.ts";
import { registerVerify } from "./register-verify.ts";
import { loginVerify } from "./login-verify.ts";
import { generateAuthChallenge } from "./generate-challenge.ts";

const authRouter = new Router();

authRouter
  .post("/auth/register-options", registerOptions)
  .post("/auth/register-verify", registerVerify)
  .post("/auth/challenge", generateAuthChallenge)
  .post("/auth/login-verify", loginVerify);

export default authRouter;
