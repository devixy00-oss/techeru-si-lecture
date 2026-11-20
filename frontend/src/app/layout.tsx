import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Techeru SI Lecture",
  description: "Techeru SI Lecture - Your AI 3D Lecture & Learning Companion",
  icons: {
    icon: "/logo_cat.png",
    shortcut: "/logo_cat.png",
    apple: "/logo_cat.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-screen w-screen overflow-hidden antialiased">
      <body className="h-screen w-screen overflow-hidden flex flex-col bg-[#0a0c14] text-white">
        {children}
      </body>
    </html>
  );
}
