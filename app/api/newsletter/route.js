import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models";

export async function POST(request) {
  try {
    const { email = "" } = await request.json();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return Response.json({ error: "Please enter a valid email." }, { status: 400 });
    await connectDB();
    await Subscriber.updateOne({ email: normalized }, { $setOnInsert: { email: normalized } }, { upsert: true });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return Response.json({ error: "Please try again in a moment." }, { status: 500 });
  }
}
