import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { AppError } from "@/server/errors";

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;

export type SessionData = { uid: string; addr: string; exp: number };

let warned = false;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    console.error("SESSION_SECRET is not set; refusing to sign or read sessions");
    throw new AppError("SERVER_MISCONFIGURED", 500, "Server is not configured");
  }
  if (!warned) {
    warned = true;
    console.warn("SESSION_SECRET is not set; using an insecure development secret");
  }
  return "pawnpool-dev-secret-do-not-use-in-production";
}

const mac = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** Pure: builds `base64url(json).base64url(hmac)`. */
export function signSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

/** Pure: returns the data if the signature is valid and not expired, else null. */
export function verifySessionToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = Buffer.from(mac(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof d?.uid !== "string" || typeof d?.addr !== "string" || typeof d?.exp !== "number") return null;
    if (d.exp <= Date.now()) return null;
    return { uid: d.uid, addr: d.addr, exp: d.exp };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; address: string } | null> {
  const jar = await cookies();
  const d = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  return d ? { userId: d.uid, address: d.addr } : null;
}

export async function setSession(user: { id: string; address: string }): Promise<void> {
  const token = signSession({ uid: user.id, addr: user.address, exp: Date.now() + SESSION_MAX_AGE_S * 1000 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function requireUser(): Promise<{ userId: string; address: string }> {
  const s = await getSession();
  if (!s) throw new AppError("UNAUTHENTICATED", 401, "Sign in first");
  return s;
}
