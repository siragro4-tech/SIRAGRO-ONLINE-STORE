import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBasket } from "@/lib/basket";

export const metadata: Metadata = {
  title: {
    default: "SIRAGRO — Your Local Online Grocery & Off-Licence Store",
    template: "%s | SIRAGRO",
  },
  description:
    "Shop groceries, fresh produce, drinks, snacks and household essentials online. Home delivery and in-store collection near UB3.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "SIRAGRO",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let basketCount = 0;
  try {
    const summary = await getBasket();
    basketCount = summary.itemCount;
  } catch {
    // Fallback gracefully
  }

  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        {/* Skip link — keyboard / screen-reader users can jump straight to content */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <Header initialItemCount={basketCount} />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}

