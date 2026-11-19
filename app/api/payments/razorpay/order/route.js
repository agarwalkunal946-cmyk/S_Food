import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, Product, StoreSettings } from "@/lib/models";
import { getRazorpayKeyId, hasRazorpayCredentials, razorpayRequest } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasRazorpayCredentials()) return Response.json({ error: "Razorpay test keys are not configured. Add them to the server environment." }, { status: 503 });
  try {
    const body = await request.json();
    const customer = clean(body.customer, 100);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 20);
    const fulfillmentMethod = body.fulfillmentMethod === "pickup" ? "pickup" : "delivery";
    const address = fulfillmentMethod === "pickup" ? "Pickup at kitchen" : clean(body.address, 240);
    const city = fulfillmentMethod === "pickup" ? "" : clean(body.city, 80);
    const postalCode = clean(body.postalCode, 12);
    if (!customer || !/^\S+@\S+\.\S+$/.test(email) || (fulfillmentMethod === "delivery" && (!address || !city)) || !Array.isArray(body.items) || !body.items.length || body.items.length > 30) {
      return Response.json({ error: "Add your contact details and a valid cart before paying." }, { status: 400 });
    }

    const quantities = new Map();
    for (const item of body.items) {
      const productId = String(item?.productId || "");
      const quantity = Math.floor(Number(item?.quantity));
      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return Response.json({ error: "Your cart contains an invalid product or quantity." }, { status: 400 });
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
      if (quantities.get(productId) > 20) return Response.json({ error: "A maximum of 20 units per product can be ordered." }, { status: 400 });
    }

    await connectDB();
    const settings = await StoreSettings.findOne({ key: "main" }).lean();
    const currency = String(settings?.currency || "INR").toUpperCase();
    if (currency !== "INR") return Response.json({ error: "Razorpay checkout is configured for INR. Set the store currency to INR in Admin → Storefront." }, { status: 400 });
    const products = await Product.find({ _id: { $in: [...quantities.keys()] }, active: true }).lean();
    const byId = new Map(products.map((product) => [product._id.toString(), product]));
    if (byId.size !== quantities.size) return Response.json({ error: "A product in your cart is no longer available. Refresh the shop and try again." }, { status: 409 });

    let subtotal = 0;
    const orderItems = [];
    for (const [productId, quantity] of quantities) {
      const product = byId.get(productId);
      if (product.stock < quantity) return Response.json({ error: `${product.name} has only ${product.stock} left in stock.` }, { status: 409 });
      subtotal += product.price * quantity;
      orderItems.push({ productId, name: product.name, image: product.images?.[0] || "", price: product.price, quantity, unit: product.unit || "" });
    }
    const shipping = fulfillmentMethod === "pickup" || subtotal >= (settings?.shippingThreshold ?? 500) ? 0 : (settings?.shippingFee ?? 60);
    subtotal = roundMoney(subtotal);
    const total = roundMoney(subtotal + shipping);
    const amount = Math.round(total * 100);
    if (amount < 100) return Response.json({ error: "Razorpay orders must be at least ₹1.00." }, { status: 400 });

    const orderNumber = `FD-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const gatewayOrder = await razorpayRequest("/orders", {
      method: "POST",
      body: { amount, currency, receipt: orderNumber, notes: { store_order: orderNumber } },
    });
    await Order.create({
      orderNumber, customer, email, phone, address, city, postalCode, fulfillmentMethod,
      items: orderItems, subtotal, shipping, total, currency,
      paymentGateway: "razorpay", paymentStatus: "Pending", razorpayOrderId: gatewayOrder.id,
    });
    return Response.json({
      keyId: getRazorpayKeyId(), razorpayOrderId: gatewayOrder.id, orderNumber,
      amount: gatewayOrder.amount, currency: gatewayOrder.currency, storeName: settings?.storeName || "Store", storeLogo: settings?.storeLogo || "",
    }, { status: 201 });
  } catch (error) {
    console.error("Razorpay order creation failed:", error.message);
    return Response.json({ error: "Could not start secure payment. Please try again." }, { status: 502 });
  }
}

function clean(value, max) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function roundMoney(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
