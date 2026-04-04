import * as React from "react"
import { StudioListClient } from "./StudioListClient"

export const metadata = {
  title: "AI Studio — Mosaic",
  description: "Build and manage your apps with AI.",
}

export default function StudioPage(): React.ReactElement {
  return <StudioListClient />
}
