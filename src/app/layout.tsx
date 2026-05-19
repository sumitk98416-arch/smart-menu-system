import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableTap — Premium QR Restaurant Ordering",
  description: "Elegant QR-based restaurant ordering platform. Scan, order, and enjoy — all from your table.",
  keywords: ["restaurant", "QR ordering", "menu", "food", "dining"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
