import { connectDB } from "@/lib/db";
import { StoreSettings } from "@/lib/models";

export async function getStoreSettings() {
  await connectDB();
  const data = await StoreSettings.findOne({ key: "main" }).lean();
  return data ? { ...data, _id: data._id.toString() } : null;
}
