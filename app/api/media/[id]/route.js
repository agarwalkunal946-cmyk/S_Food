import { Readable } from "node:stream";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return new Response("Not found", { status: 404 });
  try {
    await connectDB();
    const fileId = new mongoose.Types.ObjectId(id);
    const files = mongoose.connection.db.collection("storeMedia.files");
    const file = await files.findOne({ _id: fileId });
    if (!file) return new Response("Not found", { status: 404 });
    const contentType = file.metadata?.contentType || file.contentType || "application/octet-stream";
    if (!contentType.startsWith("image/")) return new Response("Unsupported media", { status: 415 });
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "storeMedia" });
    const stream = bucket.openDownloadStream(fileId);
    return new Response(Readable.toWeb(stream), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Store image read failed:", error.message);
    return new Response("Image unavailable", { status: 500 });
  }
}
