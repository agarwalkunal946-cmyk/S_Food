import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { getStoreSettings } from "@/lib/store";
import { ProductCard, Newsletter } from "@/components/storefront";
import { Reveal } from "@/components/motion-reveal";
import ImageDisplay from "@/components/image-display";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let settings = null; let products = [];
  try {
    await connectDB();
    [settings, products] = await Promise.all([getStoreSettings(), Product.find({ active: true }).sort({ featured: -1, createdAt: -1 }).limit(8).lean()]);
  } catch (error) { console.error("Storefront load error:", error.message); }
  const categories = settings?.categories?.length ? settings.categories : products.length ? [...new Set(products.map((product) => product.category))] : ["Small Plates", "Mains", "Bowls & Salads", "Bakery"];
  const heroImage = imageUrl(settings?.heroImage || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2200&q=88", 2200);
  return <>
    <section className="hero-section">
      <div className="hero-image" style={{ backgroundImage: `url("${heroImage}")` }} />
      <div className="hero-wash" />
      <Reveal className="hero-content wrap" onLoad><span className="eyebrow eyebrow-light"><span className="eyebrow-dot" />{settings?.heroEyebrow || "FRESH FROM OUR KITCHEN"}</span><h1>{(settings?.heroTitle || "Made with love.\nServed with joy.").split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}</h1><p>{settings?.heroText || "Seasonal ingredients, generous plates, and little moments worth gathering for. Find your new favourite and let us bring it to your table."}</p><Link className="button button-light" href="/shop">{settings?.heroCta || "Explore the menu"}<ArrowRight size={16} /></Link></Reveal>
      <span className="hero-caption">{settings?.storeName || "GATHER & GRAIN"}&nbsp; · &nbsp;Made fresh, shared with love</span>
      <a className="hero-scroll" href="#collection"><span>SCROLL TO THE MENU</span><span className="scroll-line" /></a>
    </section>
    <section className="intro-band wrap"><span className="eyebrow">{settings?.introEyebrow || "FRESH FROM OUR KITCHEN"}</span><p>{settings?.introText || "Good food brings us together."} <em>{settings?.introEmphasis || "Pull up a chair."}</em></p><Sparkles size={22} strokeWidth={1.15} /></section>
    <section className="collection-section wrap" id="collection"><Reveal className="section-heading"><div><span className="eyebrow">{settings?.collectionEyebrow || "MADE FRESH TODAY"}</span><h2>{emphasizeLast(settings?.collectionTitle || "A little something delicious.")}</h2></div><Link href="/shop" className="text-link">Explore the {settings?.productPlural?.toLowerCase() || "menu"} <ArrowUpRight size={16} /></Link></Reveal>
      {products.length ? <Reveal className="product-grid" delay={0.12}>{products.slice(0, 4).map((product, index) => <ProductCard product={serialize(product)} key={product._id.toString()} index={index} currency={settings?.currency} settings={settings || {}} />)}</Reveal> : <div className="setup-notice">Your kitchen is ready for its first menu. Start MongoDB and run <code>npm run seed</code> to add a sample food catalog.</div>}
    </section>
    <section className="category-section"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">{settings?.categoryEyebrow || "FIND YOUR CRAVING"}</span><h2>{emphasizeLast(settings?.categoryTitle || "Something good is cooking.")}</h2></div><span className="category-aside">{settings?.categoryText || "A little comfort, a lot of flavour, and something for every appetite."}</span></div><Reveal className="category-grid" delay={0.08}>{categories.slice(0, 4).map((category, index) => <Link href={`/shop?category=${encodeURIComponent(category)}`} className="category-tile" key={category}><div className="category-image-layer"><ImageDisplay src={imageUrl(settings?.categoryImages?.[index], 900)} alt="" fallback={category} /></div><span className="category-number">0{index + 1} / {String(categories.length).padStart(2, "0")}</span><span className="category-name">{category}<ArrowUpRight size={18} /></span></Link>)}</Reveal></div></section>
    <section className="story-section wrap" id="story"><Reveal className="story-photo" direction="left"><ImageDisplay src={imageUrl(settings?.storyImage || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85", 1300)} alt={settings?.storyTitle || "A table of freshly prepared food"} fallback="Made with care" /><span className="photo-stamp">GOOD FOOD<br />GOOD COMPANY</span></Reveal><Reveal className="story-copy" direction="right"><span className="eyebrow">{settings?.storyEyebrow || "OUR TABLE, YOUR TABLE"}</span><h2>{settings?.storyTitle || "Gather close. Eat well."}</h2><p>{settings?.storyText || "We believe the best meals are the ones shared. Every dish starts with ingredients chosen with care, recipes made to be passed around, and a little extra for the table."}</p><Link className="text-link" href="/shop">Explore our menu <ArrowRight size={16} /></Link><div className="story-signature">{settings?.storeName || "GATHER & GRAIN"}<span> · MADE FRESH DAILY</span></div></Reveal></section>
    <Newsletter settings={settings} />
    <section className="values-row wrap">{(settings?.values?.length ? settings.values : ["Fresh ingredients, every day", "Cooked with care", "Recipes made to share", "Delivered warm to your door"]).slice(0, 4).map((value, index) => <div key={`${index}-${value}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{value}</p></div>)}</section>
  </>;
}

function serialize(product) { return { ...product, _id: product._id.toString() }; }
function imageUrl(value, width = 1000) { const source = String(value || "").trim(); if (/^photo-[\w-]+$/.test(source)) return `https://images.unsplash.com/${source}?auto=format&fit=crop&w=${width}&q=85`; if (/^images\.unsplash\.com\//.test(source)) return `https://${source}`; return source; }
function emphasizeLast(value) { const words = String(value).trim().split(/\s+/); return <>{words.slice(0, -1).join(" ")} <em>{words.at(-1)}</em></>; }
