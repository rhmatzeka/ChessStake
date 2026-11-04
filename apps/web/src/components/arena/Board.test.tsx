import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board, type BoardArrow } from "./Board";
import { Sprite } from "../site/Sprite";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PIECES = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];
const web = path.resolve(__dirname, "../../..");
const dataUri = (file: string) =>
  `data:image/png;base64,${readFileSync(path.join(web, "public/assets/chess", file)).toString("base64")}`;
const css = (file: string) => readFileSync(path.join(web, "src/components/arena", file), "utf8");

describe("candidate arrows", () => {
  const arrows: BoardArrow[] = [
    { uci: "e2e4", letter: "A", state: "picked" },
    { uci: "d2d4", letter: "B", state: "normal" },
    { uci: "g1f3", letter: "C", state: "dim" },
  ];

  it("tells moves apart by letter, in the gold and ivory palette only", () => {
    const html = renderToStaticMarkup(<Board fen={START} lastMove={null} animate={false} arrows={arrows} />);
    for (const letter of ["A", "B", "C"]) expect(html).toContain(`>${letter}</text>`);
    const colors = new Set(html.match(/#[0-9a-f]{6}/gi));
    expect([...colors].sort()).toEqual(["#100d0a", "#e6a855", "#f3ecdf"]);
  });
});

describe("last move", () => {
  it("marks both squares with corner ticks and leaves the board color alone", () => {
    const html = renderToStaticMarkup(<Board fen={START} lastMove={{ uci: "e2e4" }} animate={false} />);
    expect(html).not.toContain("bg-gold");
    expect(html.match(/data-last-move/g)).toHaveLength(2);
  });
});

describe("board art never depends on a separate request", () => {
  it("renders the board and pieces without fetching an image", () => {
    const html = renderToStaticMarkup(<Board fen={START} lastMove={null} animate={false} />);
    expect(html).not.toContain("/assets/chess/");
    expect(html).not.toContain("<img");
    expect(html.match(/chess-piece/g)).toHaveLength(32);
  });

  it("renders site sprites without fetching an image", () => {
    const html = renderToStaticMarkup(<Sprite piece="knight" size={32} />);
    expect(html).not.toContain("/assets/chess/");
    expect(html).not.toContain("<img");
  });

  it("keeps the embedded art identical to the source files", () => {
    const pieces = css("chess-pieces.css");
    for (const side of ["White", "Black"]) {
      for (const name of PIECES) expect(pieces).toContain(dataUri(`${side}${name}.png`));
    }
    expect(css("chess-board.css")).toContain(dataUri("Board.png"));
  });
});
