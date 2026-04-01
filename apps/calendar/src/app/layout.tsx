import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"
import { Caveat } from "next/font/google"
import "./globals.css"

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-sketch",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Calendar | Mosaic",
  description: "Family calendar",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caveat.variable}>
      <body>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
