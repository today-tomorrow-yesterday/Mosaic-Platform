import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"
import { Fraunces, DM_Sans } from "next/font/google"
import { cookies } from "next/headers"
import { getSeasonById, getSeasonCssVars } from "@/lib/season"
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const override = cookieStore.get("mosaic-season")?.value
  const season = getSeasonById(override)
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
