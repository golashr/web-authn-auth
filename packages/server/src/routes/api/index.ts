import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getItems } from "./items.ts";

const apiRouter = new Router();

apiRouter
  .get("/api/items", getItems);

export default apiRouter;
