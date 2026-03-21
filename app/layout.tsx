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
  title: "Frozenclaw | Dein KI-Agent hinter dem Tor",
  description:
    "Hosted OpenClaw aus Deutschland: eigene Instanz, EU-Hosting, BYOK als Standard und Managed als begrenzter Pilot.",
  openGraph: {
    title: "Frozenclaw",
    description:
      "Dein KI-Agent hinter dem Tor. Hosted OpenClaw mit EU-Infrastruktur, BYOK als Startangebot und Managed als begrenzter Pilot.",
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
