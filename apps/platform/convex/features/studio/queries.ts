import { query } from "../../_generated/server"
import { ConvexTranslator } from "@mosaic/db"
import { PrototypeRepository } from "./PrototypeRepository"

export const listSaved = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const db = new ConvexTranslator(ctx.db)
    const repo = new PrototypeRepository(db)
    return repo.getSaved(identity.tokenIdentifier)
  },
})
