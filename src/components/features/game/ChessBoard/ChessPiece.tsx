'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChessPiece as ChessPieceType } from './ChessBoard.types';
import { memo } from 'react';

interface ChessPieceProps {
  piece: ChessPieceType;
  onClick?: (piece: ChessPieceType) => void;
  className?: string;
}

function ChessPieceComponent({ piece, onClick, className }: ChessPieceProps) {
  const variants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -180
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    revealed: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.3
      }
    },
    matched: {
      scale: 1.1,
      opacity: 0.8,
      transition: {
        repeat: Infinity,
        repeatType: 'reverse' as const,
        duration: 1
      }
    }
  };

  const getAnimationState = () => {
    if (!piece.isRevealed) return 'hidden';
    if (piece.isMatched) return 'matched';
    return 'visible';
  };

  return (
    <motion.div
      className={cn(
        'absolute inset-0 flex items-center justify-center cursor-pointer',
        'hover:bg-blue-500/20 transition-colors duration-200',
        piece.color === 'white' ? 'text-white' : 'text-gray-900',
        className
      )}
      variants={variants}
      initial="hidden"
      animate={getAnimationState()}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(piece)}
    >
      <span className="text-4xl pointer-events-none select-none">{piece.symbol}</span>
      {!piece.isRevealed && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}

export const ChessPiece = memo(ChessPieceComponent, (prevProps, nextProps) => {
  // Only re-render if these props have changed
  return (
    prevProps.piece.id === nextProps.piece.id &&
    prevProps.piece.isRevealed === nextProps.piece.isRevealed &&
    prevProps.piece.isMatched === nextProps.piece.isMatched &&
    prevProps.onClick === nextProps.onClick
  );
}); 