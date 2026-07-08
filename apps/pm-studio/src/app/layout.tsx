import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { ThemeApplier } from "@/components/settings/ThemeApplier";
import { themeInitScript } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic PM Studio",
  description:
    "Lokale Projektmanagement-Plattform mit KI-Agenten – Ideen werden über eine Agenten-Pipeline in echte Projektstrukturen überführt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme is applied at runtime (TASK-029): the no-flash script sets the `.dark`
  // class from localStorage before the first paint, so <html> ships without a
  // hardcoded theme. suppressHydrationWarning silences the expected class diff.
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
