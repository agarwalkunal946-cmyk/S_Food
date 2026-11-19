import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Product } from "@/lib/models";

export async function PUT(request, { params }) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid product id." }, { status: 400 });
  try {
    const body = await request.json();
    if (body.name && !body.slug) body.slug = body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await connectDB();
    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
    return Response.json({ ...product, _id: product._id.toString() });
  } catch (error) {
    return Response.json({ error: error.code === 11000 ? "That product URL already exists." : error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid product id." }, { status: 400 });
  await connectDB();
  const product = await Product.findByIdAndDelete(id);
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
  return Response.json({ ok: true });
}
