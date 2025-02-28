import type { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ApiResponse, Item, ItemsResponse } from "../../types/types.ts";

export function getItems(ctx: Context) {
    const items: Item[] = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
      ];
      
      const response: ApiResponse<ItemsResponse> = {
        success: true,
        data: { items }
      };
      ctx.response.body = response;
}