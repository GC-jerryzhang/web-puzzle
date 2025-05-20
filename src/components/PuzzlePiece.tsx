import React from 'react';
import { type Piece } from '../types/puzzle';
import '../styles/PuzzlePiece.css';

interface PuzzlePieceProps {
  piece: Piece;
  gridSize: number;
  imageUrl: string;
  boardSize: number;
  onDragStart: (e: React.DragEvent, pieceId: number) => void; // 简化传递参数，偏移量在Game中计算
  isDragging: boolean; // 是否正在拖拽的标志
}

const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece, gridSize, imageUrl, boardSize, onDragStart, isDragging
}) => {
  const row = Math.floor(piece.correctIndex / gridSize);
  const col = piece.correctIndex % gridSize;
  const pieceSize = boardSize / gridSize;

  const backgroundPosition = `${(-col * pieceSize)}px ${(-row * pieceSize)}px`;
  const backgroundSize = `${boardSize}px ${boardSize}px`;

  const handleDragStart = (e: React.DragEvent) => {
       // 设置拖拽数据为拼图块的 ID
      e.dataTransfer.setData('text/plain', piece.id.toString());
      e.dataTransfer.setDragImage(e.currentTarget, pieceSize / 2, pieceSize / 2); // 设置拖拽图像中心为鼠标位置
      e.dataTransfer.effectAllowed = 'move';

      onDragStart(e, piece.id); // 通知父组件开始拖拽哪个块
   };


  return (
    <div
      className={`puzzle-piece ${piece.isSnapped ? 'snapped' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${piece.x}px`, // 使用 piece.x, piece.y 作为绝对定位坐标
        top: `${piece.y}px`,
        width: `${pieceSize}px`,
        height: `${pieceSize}px`,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: backgroundSize,
        backgroundPosition: backgroundPosition,
        transition: piece.isSnapped ? 'left 0.2s ease-out, top 0.2s ease-out' : 'none',
        cursor: piece.isSnapped ? 'default' : 'grab',
        pointerEvents: piece.isSnapped ? 'none' : 'auto', // 如果希望吸附后不可拖拽，取消注释
        zIndex: isDragging ? 10 : (piece.isSnapped ? 1 : 0), // 拖拽时层级最高，吸附次之
      }}
      draggable={!piece.isSnapped} // 吸附后禁止拖拽
      onDragStart={handleDragStart}
    >
       <div style={{ color: 'white', fontSize: '20px', textShadow: '1px 1px 2px black' }}>{piece.correctIndex}</div> 
    </div>
  );
};



export default PuzzlePiece;