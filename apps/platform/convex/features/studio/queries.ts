import { query } from "../../_generated/server"
import { v } from "convex/values"
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

/** Fetch a single prototype by ID — used for /studio/[id] resume flow */
export const getById = query({
  args: { id: v.id("prototypeApps") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const db = new ConvexTranslator(ctx.db)
    const repo = new PrototypeRepository(db)
    const doc = await repo.getById(String(args.id))
    if (!doc || doc.tokenIdentifier !== identity.tokenIdentifier) return null
    return doc
  },
})
