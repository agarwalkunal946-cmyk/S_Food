const RAZORPAY_API = "https://api.razorpay.com/v1";

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}

export function hasRazorpayCredentials() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function razorpayRequest(path, { method = "GET", body } = {}) {
  if (!hasRazorpayCredentials()) throw new Error("Razorpay test keys are not configured on the server.");
  const authorization = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    method,
    cache: "no-store",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.error?.description || "Razorpay could not process this request.");
    error.status = response.status;
    throw error;
  }
  return result;
}
