import type { Metadata } from "next";
import { Oswald, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frozenclaw.com"),
  title: "Frozenclaw | Gehostetes OpenClaw aus Deutschland",
  description:
    "Gehostetes OpenClaw aus Deutschland: eigene Instanz, schneller Start und Hosting mit eigenem Modell-Key als öffentliches Hauptangebot.",
  openGraph: {
    title: "Frozenclaw",
    description:
      "Gehostetes OpenClaw mit deutscher Infrastruktur, eigener Instanz und klarem Startangebot für Kunden mit eigenem Modell-Key.",
    url: "https://frozenclaw.com",
    siteName: "Frozenclaw",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
