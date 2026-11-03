import { randomInt } from "node:crypto";
import type { Hex } from "viem";
import { parseSiweMessage } from "viem/siwe";
import { verifyMessage } from "viem/utils";
import type { User } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { AppError } from "@/server/errors";

const NONCE_TTL_MS = 10 * 60 * 1000;
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export async function createNonce(): Promise<string> {
  let nonce = "";
  for (let i = 0; i < 24; i++) nonce += ALPHABET[randomInt(ALPHABET.length)];
  await prisma.authNonce.create({ data: { nonce, expiresAt: new Date(Date.now() + NONCE_TTL_MS) } });
  // Opportunistic cleanup of long-dead nonces.
  void prisma.authNonce.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
  return nonce;
}

export async function verifySignIn(message: string, signature: Hex, expectedDomain: string): Promise<User> {
  const parsed = parseSiweMessage(message);
  if (!parsed.address || !parsed.nonce || !parsed.domain) throw new AppError("BAD_MESSAGE", 400, "Invalid sign-in message");
  if (parsed.domain !== expectedDomain) throw new AppError("BAD_DOMAIN", 401, "Sign-in message is for another site");
  const now = new Date();
  if (parsed.expirationTime && parsed.expirationTime <= now) throw new AppError("NONCE_EXPIRED", 401, "Sign-in expired");
  if (parsed.notBefore && parsed.notBefore > now) throw new AppError("BAD_MESSAGE", 400, "Sign-in not yet valid");

  const row = await prisma.authNonce.findUnique({ where: { nonce: parsed.nonce } });
  if (!row) throw new AppError("NONCE_UNKNOWN", 401, "Unknown sign-in nonce");
  if (row.usedAt) throw new AppError("NONCE_USED", 401, "Sign-in nonce already used");
  if (row.expiresAt <= now) throw new AppError("NONCE_EXPIRED", 401, "Sign-in nonce expired");

  let valid = false;
  try {
    valid = await verifyMessage({ address: parsed.address, message, signature });
  } catch {
    valid = false;
  }
  if (!valid) throw new AppError("BAD_SIGNATURE", 401, "Signature does not match");

  const claimed = await prisma.authNonce.updateMany({
    where: { nonce: parsed.nonce, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) throw new AppError("NONCE_USED", 401, "Sign-in nonce already used");

  const address = parsed.address.toLowerCase();
  return prisma.user.upsert({ where: { address }, update: {}, create: { address } });
}
