import * as React from "react"
import { StudioClient } from "../StudioClient"

export const metadata = {
  title: "Edit App — AI Studio — Mosaic",
  description: "Continue building your app.",
}

export default function EditStudioPage({ params }: { params: Promise<{ id: string }> }): React.ReactElement {
  // The StudioClient will read the ID from the URL and load the prototype
  // TODO: Pass the resolved ID to StudioClient for loading from Convex
  return <StudioClient />
}
