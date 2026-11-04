import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArenaTabs, visibleTab } from "./ArenaTabs";

describe("ArenaTabs", () => {
  const tabs = [
    { id: "you", label: "You", content: <button>Sign in</button> },
    { id: "moves", label: "Moves", content: <p>Move list</p> },
  ];

  it("keeps every panel mounted, so sign-in still works from another tab", () => {
    const html = renderToStaticMarkup(<ArenaTabs tabs={tabs} />);
    expect(html).toContain("Sign in");
    expect(html).toContain("Move list");
  });

  it("falls back to the first tab when the open tab goes away", () => {
    expect(visibleTab(tabs, "gone")).toBe("you");
    expect(visibleTab(tabs, "moves")).toBe("moves");
  });

  it("shows the first tab and hides the rest", () => {
    const html = renderToStaticMarkup(<ArenaTabs tabs={tabs} />);
    expect(html.match(/hidden=""/g)).toHaveLength(1);
    expect(html).toContain('aria-pressed="true"');
  });
});
