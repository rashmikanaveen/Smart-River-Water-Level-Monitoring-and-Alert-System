import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UnitProvider } from "@/context/unit-context"
import { WebSocketWrapper } from "@/components/websocket-wrapper"
import { LayoutContent } from "@/components/layout-content"
import { AuthProvider } from "@/context/auth-context"
import Footer from "@/components/footer"

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
        <AuthProvider>
          <UnitProvider>
            <WebSocketWrapper>
              <LayoutContent>{children}</LayoutContent>
              <Footer />
            </WebSocketWrapper>
          </UnitProvider>
        </AuthProvider>
      </body>
    </html>
  )
}