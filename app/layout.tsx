import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeafLens - AI Plant Disease Detection",
  description: "Advanced AI-powered plant disease detection and diagnosis system. Upload a photo of your plant leaf to get instant disease identification and treatment recommendations.",
  keywords: ["plant disease", "AI detection", "agriculture", "crop health", "plant diagnosis"],
  authors: [{ name: "LeafLens Team" }],
  openGraph: {
    title: "LeafLens - AI Plant Disease Detection",
    description: "AI-powered plant disease detection system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
