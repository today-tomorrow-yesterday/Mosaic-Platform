import { ConvexError } from "convex/values"
import { mutation } from "../../_generated/server"
import { v } from "convex/values"
import { ConvexTranslator } from "../../_shared/ConvexTranslator"
import { PrototypeRepository } from "./PrototypeRepository"

export const save = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    conversationJson: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    const db = new ConvexTranslator(ctx.db)
    const repo = new PrototypeRepository(db)
    return repo.insert({
      name: args.name,
      code: args.code,
      conversationJson: args.conversationJson,
      status: "saved",
      tokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("prototypeApps"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    conversationJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    const db = new ConvexTranslator(ctx.db)
    const repo = new PrototypeRepository(db)
    const doc = await repo.getById(String(args.id))
    if (!doc || doc.tokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError("Not found")
    }
    const patch: Partial<typeof doc> = { updatedAt: Date.now() }
    if (args.name !== undefined) patch.name = args.name
    if (args.code !== undefined) patch.code = args.code
    if (args.conversationJson !== undefined) patch.conversationJson = args.conversationJson
    await repo.update(String(args.id), patch)
  },
})

export const remove = mutation({
  args: { id: v.id("prototypeApps") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    const db = new ConvexTranslator(ctx.db)
    const repo = new PrototypeRepository(db)
    const doc = await repo.getById(String(args.id))
    if (!doc || doc.tokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError("Not found")
    }
    await repo.delete(String(args.id))
  },
})
