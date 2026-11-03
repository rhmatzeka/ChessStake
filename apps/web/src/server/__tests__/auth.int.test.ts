import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createSiweMessage } from "viem/siwe";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "@/server/prisma";
import { createNonce, verifySignIn } from "@/server/auth";
import { resetDatabase, truncateAll } from "@/test/db";

const account = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const DOMAIN = "pawnpool.test";

function msg(nonce: string, over: { domain?: string; address?: `0x${string}` } = {}) {
  return createSiweMessage({
    address: over.address ?? account.address,
    chainId: 1,
    domain: over.domain ?? DOMAIN,
    nonce,
    uri: `https://${over.domain ?? DOMAIN}`,
    version: "1",
    statement: "Sign in to PawnPool",
  });
}

async function code(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return "NO_ERROR";
}

describe("auth (SIWE)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  beforeEach(async () => {
    await truncateAll();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("signs in with a valid signature and upserts a lowercase address", async () => {
    const nonce = await createNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9]{16,}$/);
    const m = msg(nonce);
    const user = await verifySignIn(m, await account.signMessage({ message: m }), DOMAIN);
    expect(user.address).toBe(account.address.toLowerCase());
    const again = await createNonce();
    const m2 = msg(again);
    const user2 = await verifySignIn(m2, await account.signMessage({ message: m2 }), DOMAIN);
    expect(user2.id).toBe(user.id);
  });

  it("rejects a reused nonce", async () => {
    const m = msg(await createNonce());
    const sig = await account.signMessage({ message: m });
    await verifySignIn(m, sig, DOMAIN);
    expect(await code(verifySignIn(m, sig, DOMAIN))).toBe("NONCE_USED");
  });

  it("only one of two concurrent uses succeeds", async () => {
    const m = msg(await createNonce());
    const sig = await account.signMessage({ message: m });
    const r = await Promise.all([code(verifySignIn(m, sig, DOMAIN)), code(verifySignIn(m, sig, DOMAIN))]);
    expect(r.filter((x) => x === "NO_ERROR")).toHaveLength(1);
  });

  it("rejects an expired nonce", async () => {
    const nonce = await createNonce();
    await prisma.authNonce.update({ where: { nonce }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const m = msg(nonce);
    expect(await code(verifySignIn(m, await account.signMessage({ message: m }), DOMAIN))).toBe("NONCE_EXPIRED");
  });

  it("rejects an unknown nonce", async () => {
    const m = msg("unknownnonce12345678");
    expect(await code(verifySignIn(m, await account.signMessage({ message: m }), DOMAIN))).toBe("NONCE_UNKNOWN");
  });

  it("rejects a wrong domain", async () => {
    const m = msg(await createNonce(), { domain: "evil.test" });
    expect(await code(verifySignIn(m, await account.signMessage({ message: m }), DOMAIN))).toBe("BAD_DOMAIN");
  });

  it("rejects a signature from another key and does not burn the nonce", async () => {
    const other = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    const nonce = await createNonce();
    const m = msg(nonce);
    expect(await code(verifySignIn(m, await other.signMessage({ message: m }), DOMAIN))).toBe("BAD_SIGNATURE");
    expect(await code(verifySignIn(m, await account.signMessage({ message: m }), DOMAIN))).toBe("NO_ERROR");
  });

  it("rejects garbage messages", async () => {
    expect(await code(verifySignIn("hello", "0x00", DOMAIN))).toBe("BAD_MESSAGE");
  });
});
