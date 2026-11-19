import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/lib/models";
import { createAdminSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email = "", password = "" } = await request.json();
    await connectDB();
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createAdminSession(admin);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json({ error: "Login could not be completed. Check the database and session configuration." }, { status: 500 });
  }
}
