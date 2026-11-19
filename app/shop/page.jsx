import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { getStoreSettings } from "@/lib/store";
import { ProductCard } from "@/components/storefront";
import ValidatedForm from "@/components/validated-form";

export const dynamic = "force-dynamic";

const SORTS = {
  popular: { featured: -1, rating: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_low: { price: 1, featured: -1 },
  price_high: { price: -1, featured: -1 },
  rating: { rating: -1, reviewCount: -1 },
};

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const category = value(params?.category);
  const query = value(params?.q).trim().slice(0, 100);
  const brand = value(params?.brand);
  const sort = SORTS[value(params?.sort)] ? value(params.sort) : "popular";
  const minPrice = numeric(params?.minPrice);
  const maxPrice = numeric(params?.maxPrice);
  const inStock = value(params?.inStock) === "true";
  let products = []; let settings = null; let categories = []; let brands = [];

  try {
    await connectDB();
    [settings, categories, brands] = await Promise.all([
      getStoreSettings(),
      Product.distinct("category", { active: true }),
      Product.distinct("brand", { active: true, brand: { $nin: ["", null] } }),
    ]);
    const filter = { active: true };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (inStock) filter.stock = { $gt: 0 };
    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) filter.price.$gte = minPrice;
      if (maxPrice !== null) filter.price.$lte = maxPrice;
    }
    if (query) {
      const escaped = escapeRegex(query);
      filter.$or = ["name", "description", "category", "brand", "unit"].map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
    }
    products = await Product.find(filter).sort(SORTS[sort]).limit(100).lean();
  } catch (error) { console.error("Shop load error:", error.message); }

  categories = (categories.length ? categories : settings?.categories || []).filter(Boolean).sort((a, b) => a.localeCompare(b));
  brands = brands.filter(Boolean).sort((a, b) => a.localeCompare(b));
  const plural = settings?.productPlural || "Menu";
  const currency = settings?.currency || "INR";
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("q", query);
  if (brand) queryParams.set("brand", brand);
  if (sort !== "popular") queryParams.set("sort", sort);
  if (minPrice !== null) queryParams.set("minPrice", String(minPrice));
  if (maxPrice !== null) queryParams.set("maxPrice", String(maxPrice));
  if (inStock) queryParams.set("inStock", "true");
  const querySuffix = queryParams.size ? `?${queryParams.toString()}` : "";

  return <section className="shop-page wrap">
    <div className="shop-masthead"><span className="eyebrow">{settings?.shopEyebrow || "FRESH FROM THE KITCHEN"}</span><h1>{category || settings?.shopTitle || "Made fresh. Ordered easy."}<span className="heading-period">.</span></h1><p>{settings?.shopText || "A menu of familiar favourites and new discoveries, prepared with care."}</p></div>
    <nav className="shop-category-rail" aria-label="Product categories"><Link className={!category ? "filter-active" : ""} href={`/shop${querySuffix}`}>All products</Link>{categories.map((name) => <Link className={category === name ? "filter-active" : ""} href={`/shop?${new URLSearchParams({ ...Object.fromEntries(queryParams), category: name }).toString()}`} key={name}>{name}</Link>)}</nav>
    <ValidatedForm method="get" className="shop-catalog-layout">
      {category && <input type="hidden" name="category" value={category} />}
      <aside className="shop-filter-panel"><div className="filter-panel-heading"><SlidersHorizontal size={17} /><strong>Filters</strong><Link href={`/shop${category ? `?category=${encodeURIComponent(category)}` : ""}`}>Clear</Link></div>
        <label className="shop-search-field"><span>Search the store</span><div><Search size={16} /><input name="q" defaultValue={query} placeholder="Name, brand, category..." /></div></label>
        <div className="filter-group"><span className="filter-label">PRICE RANGE</span><div className="price-range-inputs"><label><span>Min</span><input name="minPrice" type="number" min="0" step="1" defaultValue={minPrice ?? ""} placeholder="₹0" /></label><span>to</span><label><span>Max</span><input name="maxPrice" type="number" min="0" step="1" defaultValue={maxPrice ?? ""} placeholder="No limit" /></label></div></div>
        {brands.length > 0 && <label className="filter-group"><span className="filter-label">BRAND</span><select name="brand" defaultValue={brand}><option value="">All brands</option>{brands.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>}
        <label className="stock-filter"><input type="checkbox" name="inStock" value="true" defaultChecked={inStock} /><span>In stock only</span></label>
        <button className="button button-dark filter-apply" type="submit">Apply filters</button>
      </aside>
      <div className="shop-results"><div className="shop-results-toolbar"><div><span className="eyebrow">{category ? category.toUpperCase() : "SHOP ALL"}</span><strong>{products.length} {products.length === 1 ? (settings?.productLabel || "product").toLowerCase() : plural.toLowerCase()}</strong></div><label>Sort by<select name="sort" defaultValue={sort}><option value="popular">Recommended</option><option value="newest">Newest arrivals</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="rating">Top rated</option></select></label></div>
        {products.length ? <div className="product-grid shop-grid">{products.map((product, index) => <ProductCard product={{ ...product, _id: product._id.toString() }} key={product._id.toString()} index={index} currency={currency} settings={settings || {}} />)}</div> : <div className="empty-results"><span className="eyebrow">NO MATCHES THIS TIME</span><h2>No products found.</h2><p>Try a different search or clear a filter to see more of the store.</p><Link className="button button-dark" href={`/shop${category ? `?category=${encodeURIComponent(category)}` : ""}`}>Clear filters</Link></div>}
      </div>
    </ValidatedForm>
  </section>;
}

function value(input) { return Array.isArray(input) ? input[0] || "" : input || ""; }
function numeric(input) { const raw = value(input).trim(); if (!raw) return null; const parsed = Number(raw); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function escapeRegex(input) { return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
