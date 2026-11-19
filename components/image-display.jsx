"use client";

import { useState } from "react";

export default function ImageDisplay({ src, alt = "", className = "", fallback = "Image unavailable", loading = "lazy", ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`image-placeholder image-load-fallback ${className}`} role="img" aria-label={alt || fallback}><img className="image-fallback-art" src={fallbackArt(fallback)} alt="" aria-hidden="true" /><span className="image-fallback-label">{fallback}</span></div>;
  return <img src={src} alt={alt} className={className} loading={loading} decoding="async" onError={() => setFailed(true)} {...props} />;
}

function fallbackArt(label) {
  const value = String(label || "").toLowerCase();
  if (/electronic|phone|computer|audio|speaker|headphone/.test(value)) return "/category-art/electronics.svg";
  if (/fashion|cloth|shoe|bag|wear|accessor|tote/.test(value)) return "/category-art/fashion.svg";
  if (/food|grocery|fruit|vegetable|produce|dairy|egg|bakery|pantry|snack|beverage|mango|apple|milk|bread|dish|menu|meal|main|starter|plate|dessert|sweet|drink|coffee|tea|salad|soup|pasta|bowl|brunch|breakfast|pastr|cake|cookie|roast|curry|falafel|chickpea|toast|kitchen|catering/.test(value)) return "/category-art/grocery.svg";
  if (/home|living|kitchen|decor|ceramic|furniture/.test(value)) return "/category-art/home.svg";
  return "/category-art/general.svg";
}
