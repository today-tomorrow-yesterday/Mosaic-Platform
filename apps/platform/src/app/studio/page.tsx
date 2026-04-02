import * as React from "react"
import { StudioClient } from "./StudioClient"

export const metadata = {
  title: "AI Studio — Mosaic",
  description: "Build working apps from plain English descriptions.",
}

export default function StudioPage(): React.ReactElement {
  return <StudioClient />
}
