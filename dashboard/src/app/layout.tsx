import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "CallAI — Support Insights",
  description: "Understand recurring issues from your support calls",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} overflow-x-hidden font-sans`}>
        <div className="flex min-h-screen page-gradient">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">
              <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
