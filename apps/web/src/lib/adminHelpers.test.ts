import { describe, expect, it } from "vitest";
import { adminErrorMessage, isoToWibLocal, wibLocalToIso } from "./adminHelpers";

describe("wib datetime-local conversion", () => {
  it("reads the input as WIB (UTC+7) and returns ISO UTC", () => {
    expect(wibLocalToIso("2026-11-03T20:30")).toBe("2026-11-03T13:30:00.000Z");
  });
  it("crosses midnight UTC backwards", () => {
    expect(wibLocalToIso("2026-11-04T03:00")).toBe("2026-11-03T20:00:00.000Z");
    expect(wibLocalToIso("2026-01-01T00:30")).toBe("2025-12-31T17:30:00.000Z");
  });
  it("renders ISO UTC as WIB for the input, crossing midnight forwards", () => {
    expect(isoToWibLocal("2026-11-03T20:00:00.000Z")).toBe("2026-11-04T03:00");
    expect(isoToWibLocal("2025-12-31T17:30:00.000Z")).toBe("2026-01-01T00:30");
  });
  it("round-trips", () => {
    expect(wibLocalToIso(isoToWibLocal("2026-06-15T23:45:00.000Z"))).toBe("2026-06-15T23:45:00.000Z");
  });
  it("rejects bad input", () => {
    expect(() => wibLocalToIso("")).toThrow();
    expect(() => wibLocalToIso("nope")).toThrow();
  });
});

describe("adminErrorMessage", () => {
  it("maps known codes", () => {
    expect(adminErrorMessage("SLUG_TAKEN", "x")).toBe("That slug is already used");
    expect(adminErrorMessage("SLUG_RESERVED", "x")).toBe("That slug is reserved");
    expect(adminErrorMessage("EVENT_LOCKED", "x")).toBe("This event already started");
    expect(adminErrorMessage("NOT_ELIGIBLE", "x")).toBe("This player is not eligible for a prize");
  });
  it("falls back to the server message", () => {
    expect(adminErrorMessage("VALIDATION_ERROR", "title too short")).toBe("title too short");
  });
});
