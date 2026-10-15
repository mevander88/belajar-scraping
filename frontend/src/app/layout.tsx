import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Layar Anime", template: "%s — Layar Anime" },
  description: "Jelajahi anime, jadwal tayang, genre, dan episode terbaru.",
  applicationName: "Layar Anime",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/images/brand/layar-anime-icon.png", type: "image/png", sizes: "1254x1254" }],
    shortcut: "/images/brand/layar-anime-icon.png",
    apple: [{ url: "/images/brand/layar-anime-icon.png", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Layar Anime",
    title: "Layar Anime",
    description: "Jelajahi anime, jadwal tayang, genre, dan episode terbaru.",
  },
};

export const viewport: Viewport = { themeColor: "#070b14", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#content">Lewati ke konten</a>
        <SiteHeader />
        <main id="content" className="pt-18">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
