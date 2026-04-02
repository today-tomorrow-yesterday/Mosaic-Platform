"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import Link from "next/link"
import { Wand2, Trash2 } from "lucide-react"

export function PrototypeCards() {
  const prototypes = useQuery(api.features.studio.queries.listSaved)
  const remove = useMutation(api.features.studio.mutations.remove)

  if (!prototypes || prototypes.length === 0) return null

  return (
    <>
      {prototypes.map(proto => (
        <div
          key={proto._id}
          className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col"
          style={{ height: 220 }}
        >
          {/* Preview thumbnail area */}
          <Link href={`/studio?id=${proto._id}`} className="flex-1 min-h-0 block bg-zinc-50 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-zinc-300">
                <Wand2 className="w-8 h-8" />
                <span className="font-body text-xs">Prototype</span>
              </div>
            </div>
          </Link>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <Link href={`/studio?id=${proto._id}`} className="min-w-0">
              <p className="font-body text-sm font-medium text-zinc-800 truncate">{proto.name}</p>
              <p className="font-body text-[11px] text-zinc-400">
                {new Date(proto.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </Link>
            <button
              onClick={() => { if (proto._id) void remove({ id: proto._id as Id<"prototypeApps"> }) }}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </>
  )
}
