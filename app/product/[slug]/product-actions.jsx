"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useCart } from "@/components/storefront";
import { formatPrice } from "@/lib/format-price";

export function AddToBag({ product, currency = "INR", addLabel = "Add to cart", cartLabel = "Basket" }) {
  const { addToCart } = useCart(); const [added, setAdded] = useState(false);
  return <div className="detail-actions"><button className="button button-dark add-to-bag" disabled={product.stock < 1} onClick={() => { addToCart(product, cartLabel); setAdded(true); }}><span>{added ? <><Check size={17} /> Added</> : <><Plus size={17} /> {addLabel}</>}</span><span className="button-price">{formatPrice(product.price, currency)}</span></button>{added && <Link className="view-bag-link" href="/cart">View your {cartLabel.toLowerCase()} <ArrowRight size={15} /></Link>}</div>;
}
