"use server"

import { cookies } from "next/headers"
import type { SeasonId } from "@/lib/season"

export async function setSeasonOverride(season: SeasonId | "auto"): Promise<void> {
  const cookieStore = await cookies()
  if (season === "auto") {
    cookieStore.delete("mosaic-season")
  } else {
    cookieStore.set("mosaic-season", season, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: false, // readable by client for display purposes
    })
  }
}
