import type { Metadata } from "next";
import { Dancing_Script, Press_Start_2P } from "next/font/google";
import "./globals.css";

const script = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Hoş Geldin Yaren",
  description:
    "Yaren için hazırlanmış özel oyun köşesi. Solitaire, Tavla ve Giydirmece oyna; sevdiğimiz şarkılara eşlik et.",
  icons: {
    // Inline SVG emoji favicon — avoids the 404 on /favicon.ico
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♥</text></svg>",
  },
  openGraph: {
    title: "Hoş Geldin Yaren",
    description: "Yaren için hazırlanmış sıcak, romantik bir oyun köşesi.",
    url: siteUrl,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${script.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
