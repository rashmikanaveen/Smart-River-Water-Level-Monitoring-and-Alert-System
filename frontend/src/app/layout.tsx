import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UnitProvider } from "@/context/unit-context"
import { LayoutContent } from "@/components/layout-content"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart River Water Level Monitoring",
  description: "Smart River Water Level Monitoring and Alert System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UnitProvider>
          <LayoutContent>{children}</LayoutContent>
        </UnitProvider>
      </body>
    </html>
  )
}