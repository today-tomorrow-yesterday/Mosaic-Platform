import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * Platform schema — add tables as features are built.
 * Each mini-app (budget, calendar, etc.) has its own Convex project and schema.
 */
export default defineSchema({
  prototypeApps: defineTable({
    name: v.string(),
    code: v.string(),
    conversationJson: v.string(),
    status: v.union(v.literal("draft"), v.literal("saved"), v.literal("archived")),
    tokenIdentifier: v.string(),
    updatedAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
})
