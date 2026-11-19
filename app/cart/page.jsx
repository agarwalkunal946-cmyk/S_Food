import { CartPage } from "@/components/storefront";
import { hasRazorpayCredentials } from "@/lib/razorpay";
import { getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CartRoute() {
  let settings = null;
  try { settings = await getStoreSettings(); } catch {}
  return <CartPage currency={settings?.currency || "INR"} shippingThreshold={settings?.shippingThreshold ?? 500} shippingFee={settings?.shippingFee ?? 60} productPlural={settings?.productPlural || "Menu"} cartLabel={settings?.cartLabel || "Order"} razorpayConfigured={hasRazorpayCredentials()} />;
}
