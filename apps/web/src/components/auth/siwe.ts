import { createSiweMessage } from "viem/siwe";

export const SIGN_IN_STATEMENT = "Sign in to PawnPool. This costs nothing and sends no transaction.";

export function buildSignInMessage(p: {
  address: `0x${string}`;
  chainId?: number;
  nonce: string;
  host: string;
  origin: string;
  now?: Date;
}): string {
  return createSiweMessage({
    address: p.address,
    chainId: p.chainId ?? 1,
    domain: p.host,
    nonce: p.nonce,
    uri: p.origin,
    version: "1",
    statement: SIGN_IN_STATEMENT,
    issuedAt: p.now ?? new Date(),
  });
}
