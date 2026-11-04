import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("sends Play now to the arena with the intent to play, so it can open sign-in", () => {
    expect(renderToStaticMarkup(<Header />)).toContain('href="/events/practice?play=1"');
  });
});
