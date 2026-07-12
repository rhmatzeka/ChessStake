import React from 'react';
import { Square } from '../../types/chess';

interface ChessSquareProps {
  square: Square;
  isLight: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
  square: _square,
  isLight: _isLight,
  children,
  onClick,
}) => {
  return (
    <div 
      className="relative flex aspect-square w-full items-center justify-center select-none transition-colors duration-200 cursor-default"
      onClick={onClick}
    >
      {children}
    </div>
  );
};
export default ChessSquare;
