import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, PackageCheck } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { getStoreSettings } from "@/lib/store";
import { ProductCard } from "@/components/storefront";
import ImageDisplay from "@/components/image-display";
import { formatPriceServer } from "@/lib/format-price-server";
import { AddToBag } from "./product-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    await connectDB();
    const product = await Product.findOne({ slug, active: true }).select("name description").lean();
  if (product) return { title: `${product.name} — Menu`, description: product.description };
  } catch {}
  return { title: "Dish details — Gather & Grain" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  await connectDB();
  const [product, settings] = await Promise.all([Product.findOne({ slug, active: true }).lean(), getStoreSettings()]);
  if (!product) notFound();
  const related = await Product.find({ active: true, category: product.category, _id: { $ne: product._id } }).limit(4).lean();
  const item = { ...product, _id: product._id.toString() };
  const price = (value) => formatPriceServer(value, settings?.currency || "INR");
  const shippingPerkText = (settings?.shippingPerkText || "Complimentary delivery on orders over {threshold}.").replace("{threshold}", price(settings?.shippingThreshold ?? 1000));
  const attributes = product.attributes?.length ? product.attributes : (product.material ? [product.material] : []);
  return <section className="product-detail-page wrap"><Link className="back-link" href="/shop"><ArrowLeft size={15} /> Back to {settings?.productPlural?.toLowerCase() || "menu"}</Link><div className="product-detail-grid"><div className="detail-gallery">{(product.images?.length ? product.images : [""]).map((image, i) => <div className="detail-image" key={`${image}-${i}`}>{image ? <ImageDisplay src={imageUrl(image, 1400)} alt={`${product.name} view ${i + 1}`} fallback={product.category} /> : <div className="image-placeholder">{product.category}</div>}</div>)}</div><div className="detail-copy"><span className="eyebrow">{product.category?.toUpperCase()}{attributes.length ? ` · ${attributes.join(" · ").toUpperCase()}` : ""}</span><h1>{product.name}<span className="heading-period">.</span></h1><div className="detail-price">{price(product.price)}{product.compareAtPrice > product.price && <del>{price(product.compareAtPrice)}</del>}</div>{product.rating > 0 && <div className="detail-rating">★ {Number(product.rating).toFixed(1)} <span>({product.reviewCount || 0} customer reviews)</span></div>}<p className="detail-description">{product.description}</p><div className="detail-rule" /><div className="detail-stock"><Check size={16} /> {product.stock > 0 ? `${product.stock} available${product.unit ? ` · ${product.unit}` : ""}` : "Currently unavailable"}</div><AddToBag product={item} currency={settings?.currency || "INR"} addLabel={settings?.addToCartLabel || "Add to order"} cartLabel={settings?.cartLabel || "Order"} /><div className="detail-shipping"><PackageCheck size={20} strokeWidth={1.3} /><span><strong>{settings?.shippingPerkTitle || "Freshness at your door."}</strong><br />{shippingPerkText}</span></div><div className="detail-accordion"><details open><summary>Dish details <span>+</span></summary><p>{product.description}{attributes.length ? ` ${attributes.join(" · ")}.` : ""}</p>{product.brand && <p><strong>Kitchen:</strong> {product.brand}</p>}{product.origin && <p><strong>Ingredients sourced:</strong> {product.origin}</p>}{product.ingredients && <p><strong>Ingredients:</strong> {product.ingredients}</p>}{product.allergens && <p><strong>Allergens:</strong> {product.allergens}</p>}{product.nutritionFacts?.length > 0 && <p><strong>Nutrition per serving:</strong> {product.nutritionFacts.join(" · ")}</p>}{product.dietaryFlags?.length > 0 && <p><strong>Dietary:</strong> {product.dietaryFlags.join(" · ")}</p>}{product.shelfLife && <p><strong>Best enjoyed:</strong> {product.shelfLife}</p>}{product.storageInstructions && <p><strong>Keep fresh:</strong> {product.storageInstructions}</p>}</details><details><summary>Delivery & pickup <span>+</span></summary><p>Delivery options and order timing are set by this kitchen. Contact us if you need a hand.</p></details></div><div className="detail-product-code">{settings?.storeName || "GATHER & GRAIN"} / {product.slug?.toUpperCase()}</div></div></div>{related.length > 0 && <div className="related-section"><div className="section-heading"><div><span className="eyebrow">YOU MAY ALSO LIKE</span><h2>More to <em>explore.</em></h2></div><Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-link">More in {product.category} <ArrowRight size={16} /></Link></div><div className="product-grid">{related.map((p, i) => <ProductCard product={{ ...p, _id: p._id.toString() }} key={p._id.toString()} index={i} currency={settings?.currency || "INR"} settings={settings || {}} />)}</div></div>}</section>;
}

function imageUrl(value, width = 1000) {
  const source = String(value || "").trim();
  if (/^photo-[\w-]+$/.test(source)) return `https://images.unsplash.com/${source}?auto=format&fit=crop&w=${width}&q=85`;
  if (/^images\.unsplash\.com\//.test(source)) return `https://${source}`;
  return source;
}
