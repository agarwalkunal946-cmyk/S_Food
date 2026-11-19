import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "s_food_admin";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createAdminSession(admin) {
  const token = await new SignJWT({ sub: admin._id.toString(), email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function getAdminSession() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch { return null; }
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
