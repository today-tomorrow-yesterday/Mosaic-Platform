import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"
import { Fraunces, DM_Sans } from "next/font/google"
import { getCurrentSeason, getSeasonCssVars } from "@/lib/season"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "Mosaic",
  description: "Your personal platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const season = getCurrentSeason()
  const seasonVars = getSeasonCssVars(season)

  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${seasonVars}}` }} />
      </head>
      <body>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
