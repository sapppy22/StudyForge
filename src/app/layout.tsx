import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyForge — Adaptive Exam Prep",
  description:
    "A spaced-repetition and adaptive-testing engine that turns your notes into practice questions and a personalized study plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F7F5] text-[#37352F]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
