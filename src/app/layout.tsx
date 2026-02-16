import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sylva Music - Spotify Downloader",
  description: "Download your favorite Spotify tracks easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
