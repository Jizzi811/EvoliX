import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EvoliX · Dein Fantasy Voice Companion",
  description:
    "Ein intelligenter Fantasy-Begleiter für Pokémon, Anime, Wissen und eigene Abenteuer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${cinzel.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
