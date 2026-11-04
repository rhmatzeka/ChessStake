import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board } from "./Board";
import { Sprite } from "../site/Sprite";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PIECES = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];
const web = path.resolve(__dirname, "../../..");
const dataUri = (file: string) =>
  `data:image/png;base64,${readFileSync(path.join(web, "public/assets/chess", file)).toString("base64")}`;
const css = (file: string) => readFileSync(path.join(web, "src/components/arena", file), "utf8");

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
