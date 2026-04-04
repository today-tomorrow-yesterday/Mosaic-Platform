import * as React from "react"
import { StudioClient } from "../StudioClient"

export const metadata = {
  title: "New App — AI Studio — Mosaic",
  description: "Build a new app from plain English descriptions.",
}

export default function NewStudioPage(): React.ReactElement {
  return <StudioClient />
}
