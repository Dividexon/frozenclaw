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
    "Eigene gehostete OpenClaw-Instanz aus Deutschland. Du bringst deinen Modell-Key mit, wir übernehmen Hosting, Bereitstellung und Betrieb.",
  openGraph: {
    title: "Frozenclaw",
    description:
      "Eigene gehostete OpenClaw-Instanz mit deutscher Infrastruktur. Modell-Key vom Kunden, Hosting und Betrieb durch Frozenclaw.",
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
