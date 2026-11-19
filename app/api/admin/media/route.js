import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function POST(request) {
  if (!(await getAdminSession())) return Response.json({ error: "Sign in to upload store images." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "Choose an image file first." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "Use a JPG, PNG, WebP, AVIF, or GIF image." }, { status: 415 });
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Images must be smaller than 3 MB after compression." }, { status: 413 });

    await connectDB();
    const id = new mongoose.Types.ObjectId();
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "storeMedia" });
    const safeName = String(file.name || "store-image").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = bucket.openUploadStreamWithId(id, safeName, {
      contentType: file.type,
      metadata: { contentType: file.type, uploadedAt: new Date() },
    });
    await new Promise((resolve, reject) => {
      upload.once("error", reject);
      upload.once("finish", resolve);
      upload.end(buffer);
    });
    return Response.json({ url: `/api/media/${id.toString()}`, id: id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Store image upload failed:", error.message);
    return Response.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }
}
