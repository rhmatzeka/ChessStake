"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';
import ChessPieceSprite from './ChessPieceSprite';
import { squareToCoords } from '../../lib/chess-board';

const PLAYABLE_AREA = {
  left: 11.111,
  top: 11.111,
  width: 77.778,
  height: 77.778,
};

export const LiveChessBoard: React.FC = () => {
  const { board } = useArenaStore();

  const renderPieces = () => {
    return Object.entries(board).flatMap(([square, piece]) => {
      if (!piece) return [];

      const { row, col } = squareToCoords(square);
      const squareWidth = PLAYABLE_AREA.width / 8;
      const squareHeight = PLAYABLE_AREA.height / 8;
      const left = PLAYABLE_AREA.left + col * squareWidth;
      const top = PLAYABLE_AREA.top + row * squareHeight;

      return (
        <div
          key={square}
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${squareWidth}%`,
            height: `${squareHeight}%`,
          }}
        >
          <ChessPieceSprite
            piece={piece}
            size="82%"
            className="drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] hover:scale-110 active:scale-95 duration-100"
          />
        </div>
      );
    });
  };

  return (
    <div className="relative aspect-square w-full max-w-[min(700px,calc(100vh-150px))] overflow-hidden rounded-xl bg-[#2b1b12] shadow-2xl shadow-black/40 ring-4 ring-[#7a4c25]">
      <img
        src="/assets/chess/Board.png"
        alt="Chess board"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none [image-rendering:pixelated]"
      />
      {renderPieces()}
    </div>
  );
};
export default LiveChessBoard;
