import { connectDB } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Product } from "@/lib/models";

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  return Response.json(products.map((p) => ({ ...p, _id: p._id.toString() })));
}

export async function POST(request) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    await connectDB();
    const product = await Product.create({ ...body, slug: slugify(body.slug || body.name) });
    return Response.json({ ...product.toObject(), _id: product._id.toString() }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.code === 11000 ? "That product URL already exists." : error.message }, { status: 400 });
  }
}

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
