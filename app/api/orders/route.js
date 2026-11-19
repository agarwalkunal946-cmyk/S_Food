export async function POST() {
  return Response.json(
    { error: "Direct order placement is disabled. Use the secure Razorpay checkout." },
    { status: 410 },
  );
}
