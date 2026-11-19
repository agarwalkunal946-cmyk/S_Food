import { createHmac, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import { Order, Product } from "@/lib/models";
import { hasRazorpayCredentials, razorpayRequest } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasRazorpayCredentials()) return Response.json({ error: "Razorpay is not configured on the server." }, { status: 503 });
  let orderId = "";
  let paymentId = "";
  let lockedOrderId = null;
  let captured = false;
  const decremented = [];
  try {
    const body = await request.json();
    orderId = String(body.razorpay_order_id || "");
    paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");
    if (!orderId || !paymentId || !signature) return Response.json({ error: "Razorpay returned incomplete payment details." }, { status: 400 });

    await connectDB();
    const order = await Order.findOne({ razorpayOrderId: orderId, paymentGateway: "razorpay" });
    if (!order) return Response.json({ error: "Store order not found for this payment." }, { status: 404 });
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${order.razorpayOrderId}|${paymentId}`).digest();
    const received = Buffer.from(signature, "hex");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return Response.json({ error: "Payment signature could not be verified." }, { status: 400 });
    }

    if (order.paymentStatus === "Paid") return Response.json({ ok: true, orderNumber: order.orderNumber });
    if (order.paymentStatus === "Review Required") return Response.json({ error: "Payment received; the store needs to review this order before fulfilling it." }, { status: 409 });
    if (order.paymentStatus === "Verifying") return Response.json({ error: "Payment verification is already in progress. Please refresh in a moment." }, { status: 409 });

    let payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== order.razorpayOrderId || payment.amount !== Math.round(order.total * 100) || payment.currency !== order.currency) {
      return Response.json({ error: "Payment details do not match this order." }, { status: 400 });
    }

    const lock = await Order.updateOne({ _id: order._id, paymentStatus: "Pending" }, { $set: { paymentStatus: "Verifying" } });
    if (!lock.modifiedCount) {
      const latest = await Order.findById(order._id).lean();
      if (latest?.paymentStatus === "Paid") return Response.json({ ok: true, orderNumber: latest.orderNumber });
      return Response.json({ error: "Payment verification is already in progress. Please refresh in a moment." }, { status: 409 });
    }
    lockedOrderId = order._id;

    if (payment.status === "authorized") {
      try {
        payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
          method: "POST",
          body: { amount: payment.amount, currency: payment.currency },
        });
      } catch (captureError) {
        // A capture request can time out after Razorpay has completed it. Re-fetch
        // before deciding whether it is safe to report a failure.
        try {
          payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
        } catch {
          await markReviewRequired(order._id, paymentId, "Capture result could not be confirmed. Check Razorpay before retrying this payment.");
          lockedOrderId = null;
          return Response.json({ error: "Payment was authorized, but its capture is still being confirmed. Please contact the store before trying again." }, { status: 409 });
        }
        if (payment.status !== "captured") {
          await markReviewRequired(order._id, paymentId, `Razorpay capture needs review: ${captureError.message}`);
          lockedOrderId = null;
          return Response.json({ error: "Payment was authorized but could not be captured automatically. Please contact the store before trying again." }, { status: 409 });
        }
      }
    }

    if (payment.status !== "captured" || payment.order_id !== order.razorpayOrderId || payment.amount !== Math.round(order.total * 100) || payment.currency !== order.currency) {
      await Order.updateOne({ _id: order._id, paymentStatus: "Verifying" }, { $set: { paymentStatus: "Pending" } });
      lockedOrderId = null;
      return Response.json({ error: "Razorpay has not confirmed a captured payment yet. Please contact the store before paying again." }, { status: 409 });
    }
    captured = true;

    for (const item of order.items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, active: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
      if (!product) {
        await restoreStock(decremented);
        await Order.updateOne({ _id: order._id, paymentStatus: "Verifying" }, { $set: { paymentStatus: "Review Required", paymentNote: "Payment was captured after an item went out of stock. Refund review is required." } });
        lockedOrderId = null;
        return Response.json({ error: "Payment was received, but an item sold out during checkout. The store will review your order and contact you." }, { status: 409 });
      }
      decremented.push({ id: product._id, quantity: item.quantity });
    }

    await Order.updateOne({ _id: order._id, paymentStatus: "Verifying" }, { $set: {
      paymentStatus: "Paid", razorpayPaymentId: paymentId, paymentNote: "Payment captured and signature verified.", status: "New",
    } });
    lockedOrderId = null;
    return Response.json({ ok: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error.message);
    if (lockedOrderId) {
      if (captured) {
        await restoreStock(decremented);
        await markReviewRequired(lockedOrderId, paymentId, "Payment was captured, but order finalization failed. Manual order review is required.");
      } else {
        await Order.updateOne({ _id: lockedOrderId, paymentStatus: "Verifying" }, { $set: { paymentStatus: "Pending" } });
      }
    }
    return Response.json({ error: "We could not confirm this payment. Please refresh or contact the store before paying again." }, { status: 502 });
  }
}

async function markReviewRequired(orderId, paymentId, paymentNote) {
  await Order.updateOne({ _id: orderId, paymentStatus: "Verifying" }, { $set: {
    paymentStatus: "Review Required", razorpayPaymentId: paymentId, paymentNote,
  } });
}

async function restoreStock(items) {
  await Promise.all(items.map(({ id, quantity }) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })));
}
