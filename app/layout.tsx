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
  title: "Frozenclaw | Your AI agent behind the vault",
  description:
    "Hosted OpenClaw in a black-and-red industrial shell: private instance, EU hosting, founding member beta.",
  openGraph: {
    title: "Frozenclaw",
    description:
      "Your AI agent behind the vault. Hosted OpenClaw with EU infrastructure and a focused beta launch.",
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
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
