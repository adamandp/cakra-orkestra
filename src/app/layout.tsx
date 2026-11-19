import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { MockProvider } from "@/providers/mock-provider";
import { QueryProvider } from "@/providers/query-provider";
import { geistMono, geistSans } from "@/styles/font";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cakra Orkestra",
  description: "AI-powered team workflow and performance management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MockProvider enabled={process.env.NEXT_PUBLIC_ENABLE_MSW === "true"}>
            <QueryProvider>
              {children}
              <ThemedToaster />
            </QueryProvider>
          </MockProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
