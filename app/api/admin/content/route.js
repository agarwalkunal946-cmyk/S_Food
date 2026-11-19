import { connectDB } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { StoreSettings } from "@/lib/models";

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const settings = await StoreSettings.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { upsert: true, new: true }).lean();
  return Response.json({ ...settings, _id: settings._id.toString() });
}

export async function PUT(request) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const allowed = ["storeName", "storeLogo", "storeType", "productLabel", "productPlural", "categoryLabel", "addToCartLabel", "viewProductLabel", "cartLabel", "themePrimary", "themeAccent", "themeBackground", "announcement", "heroEyebrow", "heroTitle", "heroText", "heroImage", "heroCta", "introEyebrow", "introText", "introEmphasis", "collectionEyebrow", "collectionTitle", "categoryEyebrow", "categoryTitle", "categoryText", "categoryImages", "storyEyebrow", "storyTitle", "storyText", "storyImage", "newsletterEyebrow", "newsletterTitle", "newsletterText", "shopEyebrow", "shopTitle", "shopText", "footerTagline", "footerNote", "footerAside", "footerExploreLabel", "footerHelpLabel", "contactEmail", "shippingPerkTitle", "shippingPerkText", "values", "currency", "shippingThreshold", "shippingFee", "categories"];
  const data = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  if (data.currency !== undefined) {
    data.currency = String(data.currency).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(data.currency)) return Response.json({ error: "Currency must be a three-letter ISO code, such as INR." }, { status: 400 });
  }
  for (const field of ["themePrimary", "themeAccent", "themeBackground"]) {
    if (data[field] !== undefined && !/^#[0-9a-fA-F]{6}$/.test(data[field])) return Response.json({ error: `${field} must be a six-digit hex color.` }, { status: 400 });
  }
  for (const field of ["shippingThreshold", "shippingFee"]) {
    if (data[field] !== undefined && (!Number.isFinite(Number(data[field])) || Number(data[field]) < 0)) return Response.json({ error: `${field} must be a non-negative amount.` }, { status: 400 });
  }
  await connectDB();
  const settings = await StoreSettings.findOneAndUpdate({ key: "main" }, { $set: data, $setOnInsert: { key: "main" } }, { upsert: true, new: true, runValidators: true }).lean();
  return Response.json({ ...settings, _id: settings._id.toString() });
}
