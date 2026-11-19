import "./globals.css";
import "./catalog.css";
import "./food-theme.css";
import { CartProvider, SiteChrome } from "@/components/storefront";
import { getStoreSettings } from "@/lib/store";

export async function generateMetadata() {
  let settings = null;
  try { settings = await getStoreSettings(); } catch {}
  const storeName = settings?.storeName || "GATHER & GRAIN";
  return { title: `${storeName} — Fresh food, made with care`, description: settings?.heroText || "Fresh food, generous plates, and recipes worth gathering around." };
}

export default async function RootLayout({ children }) {
  let settings;
  try { settings = await getStoreSettings(); } catch { settings = null; }
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <CartProvider>
          <SiteChrome settings={settings}>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
