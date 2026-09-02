import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Call Analyse Agent",
  description: "Multi-agent call analysis dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-grid-pattern bg-[size:48px_48px]">
            <div className="min-h-screen bg-background/80 backdrop-blur-[2px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
