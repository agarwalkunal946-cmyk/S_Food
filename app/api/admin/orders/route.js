import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Order } from "@/lib/models";

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
  return Response.json(orders.map((order) => ({ ...order, _id: order._id.toString() })));
}

export async function PATCH(request) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await request.json();
  if (!mongoose.isValidObjectId(id) || !["New", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) return Response.json({ error: "Invalid order update." }, { status: 400 });
  await connectDB();
  const existing = await Order.findById(id).select("paymentGateway paymentStatus").lean();
  if (!existing) return Response.json({ error: "Order not found." }, { status: 404 });
  if (existing.paymentGateway === "razorpay" && existing.paymentStatus !== "Paid" && ["Processing", "Shipped", "Delivered"].includes(status)) {
    return Response.json({ error: "This order cannot be fulfilled until Razorpay confirms payment." }, { status: 409 });
  }
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
  return Response.json({ ...order, _id: order._id.toString() });
}
