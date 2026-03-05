import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://frozenclaw.com"),
  title: "FrozenClaw | Freeze the web. Build faster.",
  description:
    "FrozenClaw scrapes any website and returns clean, structured markdown for AI pipelines.",
  openGraph: {
    title: "FrozenClaw",
    description:
      "Grab any web data. Freeze it. Ship it. Structured markdown via API.",
    url: "https://frozenclaw.com",
    siteName: "FrozenClaw",
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
      <body className={`${inter.className} antialiased bg-frost-bg text-[#e8f4ff]`}>
        {children}
      </body>
    </html>
  );
}
