"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/format-price";
import Script from "next/script";
import { AnimatePresence, motion } from "motion/react";
import ValidatedForm from "@/components/validated-form";
import ImageDisplay from "@/components/image-display";

const CartContext = createContext(null);
const money = formatPrice;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("s-food-cart") || "[]")); } catch { setCart([]); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("s-food-cart", JSON.stringify(cart)); }, [cart, ready]);
  function notify(message, tone = "success") {
    window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }
  function dismissToast() { window.clearTimeout(toastTimer.current); setToast(null); }
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const addToCart = (product, cartLabel = "basket") => {
    setCart((items) => {
      const existing = items.find((item) => item._id === product._id);
      return existing ? items.map((item) => item._id === product._id ? { ...item, quantity: Math.min(product.stock || 20, item.quantity + 1) } : item) : [...items, { _id: product._id, name: product.name, slug: product.slug, price: product.price, image: product.images?.[0] || "", stock: product.stock, unit: product.unit || "", quantity: 1 }];
    });
    notify(`${product.name} added to your ${cartLabel.toLowerCase()}.`);
  };
  const setQuantity = (id, quantity) => setCart((items) => quantity <= 0 ? items.filter((item) => item._id !== id) : items.map((item) => item._id === id ? { ...item, quantity: Math.min(item.stock || 20, quantity) } : item));
  const remove = (id) => { const item = cart.find((entry) => entry._id === id); setCart((items) => items.filter((entry) => entry._id !== id)); if (item) notify(`${item.name} removed from your basket.`, "info"); };
  const clear = () => setCart([]);
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const value = useMemo(() => ({ cart, count, subtotal, addToCart, setQuantity, remove, clear, toast, notify, dismissToast }), [cart, count, subtotal, toast]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function SiteChrome({ settings, children }) {
  const pathname = usePathname();
  const { count: cartCount, toast, dismissToast } = useCart();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return children;
  const brand = settings?.storeName || "GATHER & GRAIN";
  const themeStyle = {
    "--brand-primary": settings?.themePrimary || "#71351f",
    "--brand-accent": settings?.themeAccent || "#d87545",
    "--brand-background": settings?.themeBackground || "#fff8ef",
  };
  return <div className="theme-root" data-store-type={settings?.storeType || "food"} style={themeStyle}>
    <div className="announcement">{settings?.announcement || "Made fresh to order · Free delivery over ₹500"}</div>
    <header className="site-header">
      <div className="header-inner wrap">
        <Link className="wordmark" href="/" aria-label={brand}>{settings?.storeLogo ? <ImageDisplay className="store-brand-logo" src={imageUrl(settings.storeLogo, 320)} alt={brand} fallback={brand} /> : <>{brand}<span className="wordmark-dot">.</span></>}</Link>
        <nav className="desktop-nav"><Link href="/shop">{settings?.productPlural || "Shop"}</Link><a href="/#story">Our story</a>{(settings?.categories || ["New arrivals", "Featured"]).slice(0, 2).map((category) => <Link href={`/shop?category=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}</nav>
        <div className="header-actions"><Link className="header-about" href="/#newsletter">Kitchen notes</Link><Link href="/cart" className="bag-button" aria-label={`Shopping ${settings?.cartLabel || "order"}`}><ShoppingBag size={19} strokeWidth={1.6} /><span>{settings?.cartLabel || "Order"}</span><span className="bag-count">{cartCount}</span></Link><MobileMenu categories={settings?.categories || []} productPlural={settings?.productPlural || "Menu"} /></div>
      </div>
    </header>
    <main>{children}</main>
    <Footer settings={settings} />
    <AnimatePresence>{toast && <motion.div key={`${toast.tone}-${toast.message}`} className={`store-toast toast-${toast.tone}`} role="status" aria-live="polite" initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}><span className="toast-check"><Check size={16} /></span><span>{toast.message}</span><button type="button" onClick={dismissToast} aria-label="Dismiss notification"><X size={16} /></button></motion.div>}</AnimatePresence>
  </div>;
}

function MobileMenu({ categories = [], productPlural }) {
  const [open, setOpen] = useState(false);
  return <div className="mobile-menu-wrap"><motion.button whileTap={{ scale: 0.9 }} className="icon-button mobile-menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={21} /> : <Menu size={21} />}</motion.button><AnimatePresence>{open && <motion.div className="mobile-menu" initial={{ opacity: 0, y: -9, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -7, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}><Link href="/shop" onClick={() => setOpen(false)}>{productPlural}</Link><Link href="/#story" onClick={() => setOpen(false)}>Our story</Link>{categories.slice(0, 2).map((category) => <Link href={`/shop?category=${encodeURIComponent(category)}`} key={category} onClick={() => setOpen(false)}>{category}</Link>)}<Link href="/cart" onClick={() => setOpen(false)}>Shopping bag</Link></motion.div>}</AnimatePresence></div>;
}

export function Footer({ settings }) {
  const brand = settings?.storeName || "GATHER & GRAIN";
  const email = settings?.contactEmail || "hello@gatherandgrain.local";
  return <footer className="site-footer"><div className="wrap footer-top"><div><Link className="wordmark footer-mark" href="/" aria-label={brand}>{settings?.storeLogo ? <ImageDisplay className="store-brand-logo" src={imageUrl(settings.storeLogo, 320)} alt={brand} fallback={brand} /> : <>{brand}<span className="wordmark-dot">.</span></>}</Link><p className="footer-note">{settings?.footerTagline || "Good food. Good company."}<br />{settings?.footerNote || "Made fresh, shared with love."}</p></div><div className="footer-column"><span className="footer-label">{settings?.footerExploreLabel || "THE MENU"}</span><Link href="/shop">{settings?.productPlural || "Shop all"}</Link><Link href="/#story">Our story</Link><Link href="/#newsletter">Kitchen notes</Link></div><div className="footer-column"><span className="footer-label">{settings?.footerHelpLabel || "HERE TO HELP"}</span><a href={`mailto:${email}`}>Contact us</a><a href={`mailto:${email}`}>Delivery & pickup</a><Link href="/admin/login">Studio login</Link></div><div className="footer-note footer-aside">{settings?.footerAside || "Thoughtful ingredients, generous plates, and recipes worth gathering around."}</div></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {brand} Studio</span><span>{settings?.footerNote || "Made fresh with care."}</span><a href={`mailto:${email}`}>{email}&nbsp; ↗</a></div></footer>;
}

export function ProductCard({ product, currency = "INR", settings = {}, index = 0 }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  function add() {
    addToCart(product, settings.cartLabel || "basket"); setAdded(true); window.setTimeout(() => setAdded(false), 1400);
  }
  return <motion.article className="product-card" style={{ "--card-delay": `${index * 60}ms` }} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 310, damping: 24 }}>
    <Link href={`/product/${product.slug}`} className="product-photo-wrap">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      {product.images?.[0] ? <ImageDisplay className="product-photo" src={imageUrl(product.images[0], 950)} alt={product.name} fallback={product.category} /> : <div className="image-placeholder">{product.category}</div>}
      <span className="quick-view">{settings.viewProductLabel || "View product"} <ArrowUpRight size={15} /></span>
    </Link>
    <div className="product-card-meta"><div>{product.brand && <span className="product-brand">{product.brand}</span>}<Link href={`/product/${product.slug}`} className="product-name">{product.name}</Link><span className="product-category">{product.category}{product.unit ? ` · ${product.unit}` : (product.attributes?.length || product.material) ? ` · ${(product.attributes || [product.material]).join(" · ")}` : ""}</span>{product.rating > 0 && <span className="product-rating"><span>★ {Number(product.rating).toFixed(1)}</span><small>({product.reviewCount || 0})</small></span>}</div><div className="product-price-wrap"><span className="product-price">{money(product.price, currency)}</span>{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice, currency)}</del>}</div></div>
    <button className="add-inline" onClick={add} disabled={product.stock < 1}>{added ? <><Check size={15} /> Added</> : product.stock < 1 ? "Sold out" : <><Plus size={15} /> {settings.addToCartLabel || "Add to cart"}</>}</button>
  </motion.article>;
}

export function Newsletter({ settings }) {
  const [email, setEmail] = useState(""); const [state, setState] = useState("idle");
  async function submit(event) {
    event.preventDefault(); setState("loading");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState(response.ok ? "success" : "error");
    } catch { setState("error"); }
  }
  return <section className="newsletter" id="newsletter"><div className="newsletter-orbit orbit-one" /><div className="newsletter-orbit orbit-two" /><div className="newsletter-inner"><span className="eyebrow eyebrow-light">{settings?.newsletterEyebrow || "A NOTE FROM THE STUDIO"}</span><h2>{settings?.newsletterTitle || "A slower kind of inbox."}</h2><p>{settings?.newsletterText || "Notes from the studio, new arrivals and small things worth keeping."}</p><ValidatedForm className="newsletter-form" onSubmit={submit}><input aria-label="Email address" name="email" type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required /><button aria-label="Subscribe">{state === "success" ? <Check size={19} /> : <ArrowRight size={19} />}</button></ValidatedForm><span className="newsletter-status" role={state === "error" ? "alert" : "status"}>{state === "success" ? "You’re on the list. See you in your inbox." : state === "error" ? "Something went wrong. Please try again." : "A thoughtful note, every so often. Unsubscribe whenever."}</span></div></section>;
}

export function CartPage({ currency = "INR", shippingThreshold = 500, shippingFee = 60, productPlural = "Menu", cartLabel = "Order", razorpayConfigured = false }) {
  const { cart, subtotal, setQuantity, remove, clear, notify } = useCart();
  const [order, setOrder] = useState("");
  const [paying, setPaying] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState("delivery");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayLoadError, setRazorpayLoadError] = useState(false);
  const shipping = fulfillmentMethod === "pickup" || subtotal >= shippingThreshold ? 0 : shippingFee;
  const total = subtotal + shipping;

  async function checkout(event) {
    event.preventDefault();
    if (!cart.length || paying) return;
    if (!razorpayReady || !window.Razorpay) {
      notify("Secure checkout is still loading. Please try again in a moment.", "error");
      return;
    }

    setPaying(true);
    const form = event.currentTarget;
    const customer = Object.fromEntries(new FormData(form).entries());
    try {
      const createResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customer, items: cart.map(({ _id, quantity }) => ({ productId: _id, quantity })) }),
      });
      const paymentOrder = await createResponse.json();
      if (!createResponse.ok) throw new Error(paymentOrder.error || "Could not start payment. Please try again.");

      const themeRoot = document.querySelector(".theme-root");
      const themeColor = (themeRoot ? getComputedStyle(themeRoot).getPropertyValue("--brand-primary").trim() : "") || "#394331";
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: paymentOrder.storeName,
        image: paymentOrder.storeLogo ? new URL(imageUrl(paymentOrder.storeLogo, 320), window.location.origin).href : undefined,
        description: `Order ${paymentOrder.orderNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: { name: customer.customer, email: customer.email, contact: customer.phone || "" },
        notes: { order_number: paymentOrder.orderNumber },
        theme: { color: themeColor },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verification = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verification.error || "Payment verification is pending. Contact the store before retrying.");
            clear();
            setOrder(verification.orderNumber);
            notify("Payment confirmed. Thank you for your order.");
          } catch (error) {
            notify(error.message || "We could not confirm the payment. Please contact the store.", "error");
          } finally { setPaying(false); }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      checkout.on("payment.failed", (event) => {
        setPaying(false);
        notify(event.error?.description || "Payment did not go through. You can try again.", "error");
      });
      checkout.open();
    } catch (error) {
      setPaying(false);
      notify(error.message || "Payment could not be started. Please try again.", "error");
    }
  }

  if (order) return <section className="confirmation-page wrap"><span className="success-icon"><Check size={30} /></span><span className="eyebrow">PAYMENT CONFIRMED</span><h1>Your order is in good hands.</h1><p>Order number <strong>{order}</strong>. Your payment was verified securely.</p><Link href="/shop" className="button button-dark">Continue exploring <ArrowRight size={16} /></Link></section>;

  return <section className="cart-page wrap">
    {razorpayConfigured && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => { setRazorpayLoadError(false); setRazorpayReady(true); }} onError={() => { setRazorpayLoadError(true); notify("Secure checkout could not load. Refresh and try again.", "error"); }} />}
    <div className="page-topline"><span className="eyebrow">YOUR SELECTION</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} {productPlural.toLowerCase()}</span></div><h1>Your {cartLabel}<span className="heading-period">.</span></h1>
    {cart.length === 0 ? <div className="empty-bag"><ShoppingBag size={31} strokeWidth={1.2} /><h2>Your {cartLabel} is empty for now.</h2><p>Browse the store and add something you like.</p><Link href="/shop" className="button button-dark">Browse {productPlural.toLowerCase()} <ArrowRight size={16} /></Link></div> : <div className="checkout-layout">
      <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item._id}><Link href={`/product/${item.slug}`} className="cart-line-img">{item.image && <ImageDisplay src={imageUrl(item.image, 300)} alt={item.name} fallback={item.name} />}</Link><div className="cart-line-info"><Link href={`/product/${item.slug}`}>{item.name}</Link><span>{money(item.price, currency)}{item.unit ? ` · ${item.unit}` : ""}</span><div className="quantity-stepper"><button type="button" onClick={() => setQuantity(item._id, item.quantity - 1)} aria-label="Reduce quantity"><Minus size={13} /></button><span>{item.quantity}</span><button type="button" onClick={() => setQuantity(item._id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button type="button" className="remove-item" onClick={() => remove(item._id)}>Remove</button><strong className="cart-line-total">{money(item.price * item.quantity, currency)}</strong></div>)}</div>
      <aside className="checkout-card"><span className="eyebrow">YOUR ORDER, YOUR WAY</span><ValidatedForm onSubmit={checkout} className="checkout-form">
        <label>Full name<input name="customer" autoComplete="name" maxLength="100" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength="160" required /></label>
        <label>Phone <span className="optional">OPTIONAL</span><input name="phone" autoComplete="tel" maxLength="20" /></label>
        <label>How would you like your order?<select name="fulfillmentMethod" value={fulfillmentMethod} onChange={(event) => setFulfillmentMethod(event.target.value)}><option value="delivery">Deliver to my door</option><option value="pickup">Pick up from the kitchen</option></select></label>
        {fulfillmentMethod === "delivery" ? <><label>Street address<input name="address" autoComplete="street-address" maxLength="240" required /></label><div className="form-split"><label>City<input name="city" autoComplete="address-level2" maxLength="80" required /></label><label>PIN code<input name="postalCode" autoComplete="postal-code" maxLength="12" /></label></div></> : <p className="checkout-legal pickup-note">Pickup is free. The kitchen will confirm pickup timing with your order.</p>}
        <div className="checkout-total"><span>Subtotal</span><strong>{money(subtotal, currency)}</strong></div>
        <div className="checkout-total muted-total"><span>{fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}</span><span>{fulfillmentMethod === "pickup" ? "Free" : shipping === 0 ? "Free" : money(shipping, currency)}</span></div>
        <div className="checkout-total"><strong>Total</strong><strong>{money(total, currency)}</strong></div>
        <button className="button button-dark checkout-submit" type="submit" disabled={paying || !razorpayReady || !razorpayConfigured}>{paying ? "Opening secure checkout..." : !razorpayConfigured ? "Checkout setup needed" : razorpayLoadError ? "Checkout unavailable — refresh" : razorpayReady ? "Pay securely with Razorpay" : "Loading secure checkout..."}<ArrowRight size={16} /></button>
        <p className="checkout-legal">{razorpayConfigured ? razorpayLoadError ? "Razorpay checkout did not load. Refresh this page to try again." : "Payments are processed securely by Razorpay. Your card details never touch this store." : "Add Razorpay test keys to the server environment to turn on secure checkout."}</p>
      </ValidatedForm></aside>
    </div>}
  </section>;
}

function imageUrl(value, width = 1000) {
  const source = String(value || "").trim();
  if (/^photo-[\w-]+$/.test(source)) return `https://images.unsplash.com/${source}?auto=format&fit=crop&w=${width}&q=85`;
  if (/^images\.unsplash\.com\//.test(source)) return `https://${source}`;
  return source;
}
