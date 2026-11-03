import { describe, expect, it } from "vitest";
import { remainingMs } from "./time";

describe("remainingMs", () => {
  it("countdown uses serverNow offset", () => {
    // 10 s left on the server at fetch time, 4 s of client time have passed since.
    expect(remainingMs(110_000, 100_000, 5_000, 9_000)).toBe(6_000);
  });
  it("ignores the client clock skew, only elapsed time counts", () => {
    expect(remainingMs(110_000, 100_000, 1_000_000, 1_000_000)).toBe(10_000);
  });
  it("floors at 0", () => {
    expect(remainingMs(110_000, 100_000, 0, 60_000)).toBe(0);
  });
});
