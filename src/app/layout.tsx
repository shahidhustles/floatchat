import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { convexClient, ConvexProvider } from "@/lib/convex-client";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FloatChat - AI Ocean Data Explorer",
  description:
    "Conversational interface for ARGO oceanographic data analysis and exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexProvider client={convexClient}>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          >
            {children}
          </body>
        </html>
      </ConvexProvider>
    </ClerkProvider>
  );
}
