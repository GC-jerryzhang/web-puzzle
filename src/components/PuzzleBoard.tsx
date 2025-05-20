import React, { useRef, useEffect } from 'react';
import type { Piece, PuzzleConfig } from '../types/puzzle';
import '../styles/PuzzleBoard.css';

interface PuzzleBoardProps {
  config: PuzzleConfig; // 拼图配置
  // 回调函数，用于将板子的DOMRect信息传递给父组件
  onBoardReady: (rect: DOMRect) => void;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  config, onBoardReady
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // 在组件挂载后获取板子的位置和尺寸，并监听窗口resize
  useEffect(() => {
    const updateBoardRect = () => {
        if (boardRef.current) {
          // 获取板子相对于视口的DOMRect信息
          onBoardReady(boardRef.current.getBoundingClientRect());
        }
    };

    // 初始获取位置
    updateBoardRect();
    // 监听窗口resize事件，以防位置变化
    window.addEventListener('resize', updateBoardRect);

    // 清理函数，组件卸载时移除事件监听
    return () => {
        window.removeEventListener('resize', updateBoardRect);
    };
  }, [config.boardSize, onBoardReady]); // 依赖 boardSize 和 onBoardReady


  return (
    // 拼图板的DOM元素
    <div
      ref={boardRef} // 绑定ref以获取DOM元素
      className="puzzle-board"
      style={{
        width: `${config.boardSize}px`,
        height: `${config.boardSize}px`,
        // 绘制棋盘背景
        backgroundImage: `repeating-linear-gradient(0deg, #ccc, #ccc 1px, transparent 1px, transparent calc(${100/config.gridSize}%)),
                          repeating-linear-gradient(90deg, #ccc, #ccc 1px, transparent 1px, transparent calc(${100/config.gridSize}%))`,
        backgroundSize: `${config.boardSize/config.gridSize}px ${config.boardSize/config.gridSize}px`,
        backgroundPosition: `0 0`,
      }}
    >
      {/* 拼图块由 PuzzleGame 渲染并绝对定位 */}
    </div>
  );
};


export default PuzzleBoard;