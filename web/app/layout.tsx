import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AnimatedBackground } from "@/components/ui/animated-background"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Voxtant - AI Mock Interview Platform",
  description: "Ace your next interview with AI-powered mock interviews and real-time feedback",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnimatedBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
