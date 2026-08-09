import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCountryFromHost } from "./country-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const country = getCountryFromHost(host);
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/asnads-social.png`;

  return {
    title: `ASNads ${country.shortName} | Billboard Advertising Marketplace`,
    description: `Discover, compare and book premium billboard advertising across ${country.name}.`,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "ASNads | Own the skyline.",
      description: `The ${country.marketLabel} billboard marketplace for advertisers and media owners.`,
      type: "website",
      images: [{ url: image, width: 1733, height: 909, alt: "ASNads billboard marketplace" }],
    },
    twitter: { card: "summary_large_image", title: "ASNads | Own the skyline.", description: `The ${country.marketLabel} billboard marketplace.`, images: [image] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AE">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
