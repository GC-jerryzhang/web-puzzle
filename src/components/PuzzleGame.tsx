import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'; 
import type { Piece, PuzzleConfig } from '../types/puzzle';
import { shuffle, checkCompleted } from '../utils/shuffle';
import PuzzleBoard from './PuzzleBoard';
import PuzzlePiece from './PuzzlePiece';
import styles from '../styles/PuzzleGame.module.css'; 

// 计算目标格子位置 (相对于板子的左上角)
function getTargetPiecePosition(index: number, config: PuzzleConfig): { x: number, y: number } {
  const { gridSize, boardSize } = config;
  const pieceSize = boardSize / gridSize;
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  return {
    x: col * pieceSize,
    y: row * pieceSize,
  };
}

// 定义 PuzzleGame 组件的 props
interface PuzzleGameProps {
    config: PuzzleConfig; // 从父组件接收的配置对象
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ config }) => { 
  const [pieces, setPieces] = useState<Piece[]>([]); // 拼图块状态数组
  const [isCompleted, setIsCompleted] = useState(false); // 游戏完成状态
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null); // 存储拼图板的 viewport 坐标信息
  const gameContainerRef = useRef<HTMLDivElement>(null); // 游戏区域容器的引用
  // 存储板子相对于容器的位置，用于坐标转换 (使用 useRef 避免频繁 re-render)
  const boardRelativePosition = useRef<{ x: number, y: number } | null>(null);
  const [draggingPieceId, setDraggingPieceId] = useState<number | null>(null); // 正在拖拽的块 ID
  // 拖拽开始时鼠标在块内的偏移量 (使用 useRef 避免频繁 re-render)
  const dragOffset = useRef<{ x: number, y: number } | null>(null);

  // 创建初始拼图块数组的函数 - 包裹在 useMemo 中，只在 config 变化时重新创建 Piece 对象列表
  const initialPiecesTemplate = useMemo(() => {
      console.log("Creating initial pieces template...");
      const pieceCount = config.gridSize * config.gridSize;
      // 返回一个包含 Piece 对象的数组，但位置 x, y 默认为 0
      return Array.from({ length: pieceCount }, (_, idx) => ({
        id: idx,
        correctIndex: idx,
        x: 0, // 位置将在散布函数中设置
        y: 0,
        isSnapped: false,
      }));
  }, [config.gridSize]); 


  // 负责散布拼图块到随机初始位置的辅助函数
  // 包裹在 useCallback 中，依赖于 config 和 refs
  const scatterPieces = useCallback((piecesToScatter: Piece[], boardRect: DOMRect, containerRect: DOMRect) => {
      console.log('Scattering pieces...');
      const pieceSize = config.boardSize / config.gridSize; 

      // 计算并存储板子相对于容器的位置 (相对于容器左上角)
      const boardLeftRelativeToContainer = boardRect.left - containerRect.left;
      const boardTopRelativeToContainer = boardRect.top - containerRect.top;
      boardRelativePosition.current = {
          x: boardLeftRelativeToContainer,
          y: boardTopRelativeToContainer,
      };
      console.log('Board Relative Position:', boardRelativePosition.current);

      // 为每个块计算一个随机初始位置 (相对于容器)
      const piecesWithRandomPositions = piecesToScatter.map(piece => {
        let randomX, randomY;
        let attempts = 0;
        const maxAttempts = 100; // 防止死循环

        do {
          // 在整个游戏区域内生成随机位置 (相对于容器)
          randomX = Math.random() * (config.playAreaWidth - pieceSize); 
          randomY = Math.random() * (config.playAreaHeight - pieceSize); 

          // 检查这个随机位置是否与板子区域重叠
          const isOverlappingBoard = (
              randomX < boardLeftRelativeToContainer + config.boardSize && 
              randomX + pieceSize > boardLeftRelativeToContainer &&
              randomY < boardTopRelativeToContainer + config.boardSize && 
              randomY + pieceSize > boardTopRelativeToContainer
          );

          if (!isOverlappingBoard) break; // 找到一个不重叠的位置

          attempts++;
        } while (attempts < maxAttempts);

         // 如果多次尝试后仍重叠，将其放在左上角作为备用
       if (attempts === maxAttempts) {
           console.warn("Could not find a non-overlapping initial position for piece", piece.id);
           randomX = 0; // Fallback position
           randomY = 0;
       }

       return {
         ...piece,
         x: randomX, // 位置是相对于容器的坐标
         y: randomY, // 位置是相对于容器的坐标
         isSnapped: false, // 确保初始状态未吸附
       };
     });

     setPieces(piecesWithRandomPositions); // 更新状态，设置带有随机位置的块
     setIsCompleted(false); // 确保游戏不是完成状态
  }, [config, boardRelativePosition, setPieces, setIsCompleted]); 


  // Effect 主要用于游戏初始加载以及 config 或 boardRect 变化时
  useEffect(() => {
       const containerRect = gameContainerRef.current?.getBoundingClientRect();

       // 只有当 boardRect 和 containerRect 都已就绪时才执行
       if (boardRect && containerRect) {
             console.log('Board and Container ready.');
             // 计算并更新板子相对于容器的位置
             const boardLeftRelativeToContainer = boardRect.left - containerRect.left;
             const boardTopRelativeToContainer = boardRect.top - containerRect.top;
             // 使用 ref 来存储这个位置，因为它是布局信息，不是直接渲染的内容
             boardRelativePosition.current = {
                 x: boardLeftRelativeToContainer,
                 y: boardTopRelativeToContainer,
             };
              console.log('Board Relative Position updated:', boardRelativePosition.current);

            // 检查是否需要创建并散布新的拼图块 (首次加载或 config 变化)
            const requiredPieceCount = config.gridSize * config.gridSize;
            // 只有当 pieces 为空 或 pieces 数量不正确时，才创建并散布
            if (pieces.length === 0 || pieces.length !== requiredPieceCount) {
                console.log('Initializing or re-initializing pieces.');
                const shuffledInitialPieces = shuffle(initialPiecesTemplate); // 打乱 useMemo 生成的模板
                scatterPieces(shuffledInitialPieces, boardRect, containerRect); // 散布它们
            }
        } else {
            console.log('Waiting for board or container rect...');
        }
        // 依赖项：boardRect (当它首次可用或位置/尺寸变化时), config (当 config prop 变化时)
    }, [boardRect, config, scatterPieces, initialPiecesTemplate, pieces.length]); 

     // 进一步优化 useEffect 依赖，避免 pieces.length 依赖
      useEffect(() => {
         const containerRect = gameContainerRef.current?.getBoundingClientRect();

         if (boardRect && containerRect) {
              console.log('Board and Container ready.');

             // 计算并更新板子相对于容器的位置
             const boardLeftRelativeToContainer = boardRect.left - containerRect.left;
             const boardTopRelativeToContainer = boardRect.top - containerRect.top;
              boardRelativePosition.current = {
                  x: boardLeftRelativeToContainer,
                  y: boardTopRelativeToContainer,
              };
               console.log('Board Relative Position updated:', boardRelativePosition.current);

             // 检查是否需要创建并散布新的拼图块 (首次加载 或 config 变化 且 pieces 数量不匹配)
             const requiredPieceCount = config.gridSize * config.gridSize;
             // 仅在 pieces 为空 或者 pieces 数量不匹配新的 config 时，才创建并散布新的块
             if (pieces.length === 0 || pieces.length !== requiredPieceCount) {
                 console.log('Initializing or re-initializing pieces due to config/empty.');
                 const shuffledInitialPieces = shuffle(initialPiecesTemplate);
                 scatterPieces(shuffledInitialPieces, boardRect, containerRect);
             }
         } else {
             console.log('Waiting for board or container rect...');
         }
         // 依赖项：boardRect (初次可用或变化), config (变化), scatterPieces (useCallback保证稳定), initialPiecesTemplate (useMemo保证稳定)
         // pieces 状态不作为依赖，通过检查 pieces.length 在 effect 内部判断是否需要初始化
     }, [boardRect, config, scatterPieces, initialPiecesTemplate]); 


  // 初始化或重置游戏，包裹在 useCallback 中，依赖于 config, boardRect, gameContainerRef, scatterPieces 以及 state setter
  const resetGame = useCallback(() => {
    console.log('Resetting game...');
    setIsCompleted(false); // 重置完成状态
    setDraggingPieceId(null); // 清除拖拽状态
    dragOffset.current = null; // 重置偏移量
    boardRelativePosition.current = null; // 重置板子相对位置引用

    // 显式地重新散布拼图块，前提是板子和容器位置信息已经可用
    const containerRect = gameContainerRef.current?.getBoundingClientRect();
    if (boardRect && containerRect) {
        console.log('Resetting: Board ready, scattering pieces immediately.');
        // 创建并打乱新的 pieces 数组模板
        const shuffledInitialPieces = shuffle(initialPiecesTemplate);
        scatterPieces(shuffledInitialPieces, boardRect, containerRect); 
    } else {
        console.log('Resetting: Board not ready, scattering will happen when rects become available.');
    }
  }, [config, boardRect, gameContainerRef, scatterPieces, setIsCompleted, setDraggingPieceId, dragOffset, initialPiecesTemplate]); 


  // 处理拼图块的拖拽开始，包裹在 useCallback 中，依赖于 pieces, gameContainerRef, dragOffset, setDraggingPieceId
  const handlePieceDragStart = useCallback((e: React.DragEvent, pieceId: number) => {
      setDraggingPieceId(pieceId);

      // 找到被拖拽的块的当前状态
      const draggedPiece = pieces.find(p => p.id === pieceId);
      const containerRect = gameContainerRef.current?.getBoundingClientRect();

      if (!draggedPiece || !containerRect) {
           console.warn("Drag Start failed: piece or container not found");
           dragOffset.current = { x: 0, y: 0 }; // 备用偏移
           return;
      }

      // 计算鼠标点击位置相对于拼图块左上角的偏移量 (在 viewport 坐标系下)
      // piece 的左上角 viewport 坐标: containerRect.left + draggedPiece.x, containerRect.top + draggedPiece.y
      dragOffset.current = {
          x: e.clientX - (containerRect.left + draggedPiece.x),
          y: e.clientY - (containerRect.top + draggedPiece.y),
      };

       console.log('Drag Start:', pieceId, 'Offset:', dragOffset.current);
  }, [pieces, gameContainerRef, dragOffset, setDraggingPieceId]); // 依赖 pieces (读取当前位置), refs (读取 DOM 信息和更新 ref), state setter


  // 处理在游戏区域（容器）放下拼图块
  const handlePieceDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault(); // 阻止默认行为

      const pieceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const containerRect = gameContainerRef.current?.getBoundingClientRect();
      const boardPos = boardRelativePosition.current; // 获取板子相对于容器的位置

      // 确保所有必要信息都已就绪
      if (isNaN(pieceId) || !boardRect || !containerRect || !boardPos || dragOffset.current === null) {
          setDraggingPieceId(null); // 清除拖拽状态
          dragOffset.current = null; // 重置偏移量
          console.warn("Drop failed: missing info", { pieceId, boardRect, containerRect, boardPos, dragOffset: dragOffset.current });
          return;
      }

      // 计算放下位置相对于游戏区域容器的坐标
      // 鼠标 viewport 坐标 - 容器 viewport 坐标 - 拖拽偏移量
      const dropXRelativeToContainer = e.clientX - containerRect.left - dragOffset.current.x;
      const dropYRelativeToContainer = e.clientY - containerRect.top - dragOffset.current.y;

      // 查找被拖拽块的当前状态
      const draggedPieceIndex = pieces.findIndex(p => p.id === pieceId);
      if (draggedPieceIndex === -1) {
          setDraggingPieceId(null);
          dragOffset.current = null;
          console.warn("Drop failed: piece not found", pieceId);
          return;
      }
      const draggedPiece = pieces[draggedPieceIndex];

      const pieceSize = config.boardSize / config.gridSize; // 使用 config prop

      // 计算放下位置相对于板子左上角的坐标
      // 放下位置相对于容器的坐标 - 板子相对于容器的坐标
      const dropXRelativeToBoard = dropXRelativeToContainer - boardPos.x;
      const dropYRelativeToBoard = dropYRelativeToContainer - boardPos.y;

      console.log('Drop Piece:', pieceId, 'Client:', { x: e.clientX, y: e.clientY }, 'Drop Relative To Container:', { x: dropXRelativeToContainer, y: dropYRelativeToContainer }, 'Drop Relative To Board:', { x: dropXRelativeToBoard, y: dropYRelativeToBoard });

      let snapped = false; // 是否成功吸附
      let newPieceX = dropXRelativeToContainer; // 放下后的新 X 坐标 (相对于容器)，默认为放下时的位置
      let newPieceY = dropYRelativeToContainer; // 放下后的新 Y 坐标 (相对于容器)

      // 检查放下位置是否靠近板子区域 (使用容差范围检查)
      if (dropXRelativeToBoard >= -config.snapTolerance && dropXRelativeToBoard < config.boardSize - pieceSize + config.snapTolerance &&
          dropYRelativeToBoard >= -config.snapTolerance && dropYRelativeToBoard < config.boardSize - pieceSize + config.snapTolerance) {

          // 计算放下位置最接近哪个目标格子 (使用块的中心点判断)
          const dropCenterXRelativeToBoard = dropXRelativeToBoard + pieceSize / 2;
          const dropCenterYRelativeToBoard = dropYRelativeToBoard + pieceSize / 2;

          const targetCol = Math.floor(dropCenterXRelativeToBoard / pieceSize);
          const targetRow = Math.floor(dropCenterYRelativeToBoard / pieceSize);

          // 确保计算出的目标格子索引在有效范围内 
          if (targetCol >= 0 && targetCol < config.gridSize && targetRow >= 0 && targetRow < config.gridSize) {
              const targetIndex = targetRow * config.gridSize + targetCol;

              // 获取该目标格子的正确位置坐标 (相对于板子左上角)
              const correctTargetPosRelativeToBoard = getTargetPiecePosition(targetIndex, config);

              // 计算放下块的中心与目标格子中心之间的距离 (在板子坐标系下)
              const targetCenterXRelativeToBoard = correctTargetPosRelativeToBoard.x + pieceSize / 2;
              const targetCenterYRelativeToBoard = correctTargetPosRelativeToBoard.y + pieceSize / 2;

              const dx = dropCenterXRelativeToBoard - targetCenterXRelativeToBoard;
              const dy = dropCenterYRelativeToBoard - targetCenterYRelativeToBoard;
              const distance = Math.sqrt(dx * dx + dy * dy);

               console.log('Target Index:', targetIndex, 'Correct Index:', draggedPiece.correctIndex, 'Distance:', distance, 'Tolerance:', config.snapTolerance); 

              // 如果被拖拽的是正确块，或者放下位置在正确的目标格子附近 (在容差范围内)
              if (draggedPiece.correctIndex === targetIndex || distance <= config.snapTolerance) {
                 // 吸附到正确位置 (计算相对于容器的坐标)
                 newPieceX = boardPos.x + correctTargetPosRelativeToBoard.x; // 板子相对于容器的X + 格子相对于板子的X
                 newPieceY = boardPos.y + correctTargetPosRelativeToBoard.y; // 板子相对于容器的Y + 格子相对于板子的Y
                 snapped = true; // 标记为已吸附
                 console.log('--- Snapped! --- Piece:', pieceId, 'To Index:', targetIndex, 'At Container Pos:', { x: newPieceX, y: newPieceY });
              }
          } else {
               console.log('Dropped near board, but outside valid grid indices.');
          }
      } else {
          console.log('Dropped outside board area.');
      }

      // 更新拼图块的状态 (位置和吸附状态)
      const newPieces = pieces.map(p =>
         p.id === pieceId ? { ...p, x: newPieceX, y: newPieceY, isSnapped: snapped } : p // 只更新被拖拽的块
      );
      setPieces(newPieces); // 更新状态，触发重新渲染

      // 检查游戏是否完成
      const isGameComplete = checkCompleted(newPieces);
      console.log('Check Completed:', isGameComplete);
      setIsCompleted(isGameComplete); // 更新完成状态

      setDraggingPieceId(null); // 清除拖拽状态
      dragOffset.current = null; // 重置偏移量
  }, [pieces, boardRect, gameContainerRef, boardRelativePosition, dragOffset, setPieces, setIsCompleted, config]); // 依赖项：读写状态/ref, 读取 prop, 读取 boardRect


  // 处理拖拽结束如按 Esc键取消拖拽时，包裹在 useCallback 中，依赖于 dragOffset, setDraggingPieceId
  const handleDragEnd = useCallback(() => {
      setDraggingPieceId(null); // 清除拖拽状态
      dragOffset.current = null; // 重置偏移量
       console.log('Drag End');
  }, [dragOffset, setDraggingPieceId]); 


  return (
    // 游戏区域容器的包装器，用于整体布局
    <div className={styles['game-container-wrapper']}>
        {/* 游戏标题，放在包装器内，容器上方 */}
         <h1 className={styles['puzzle-game-title']}>{config.gridSize}x{config.gridSize} 矩形拼图</h1>

        {/* 游戏区域容器，负责定位上下文和处理拖拽事件 */}
        <div
          ref={gameContainerRef} 
          className={styles['puzzle-game-container']}
          style={{
              width: `${config.playAreaWidth}px`, // 使用 config prop
              height: `${config.playAreaHeight}px`, // 使用 config prop
              position: 'relative', // 作为内部绝对定位元素的参照系
              overflow: 'hidden', // 隐藏超出边界的拼图块
          }}
          onDragOver={(e) => e.preventDefault()} // 允许在容器内放下
          onDrop={handlePieceDrop} // 在容器上处理放下事件 
          onDragEnd={handleDragEnd} // 在容器上处理拖拽结束 
        >

          {/* 拼图板，作为目标区域和提供位置信息 */}
          <PuzzleBoard
            config={config} // 传递 config prop
            onBoardReady={setBoardRect} // 将板子的 DOMRect 回调给 PuzzleGame 
          />

          {/* 渲染所有的拼图块 */}
          {pieces.map((piece) => (
            <PuzzlePiece
              key={piece.id} // 使用 piece id 作为 React key
              piece={piece}
              gridSize={config.gridSize} // 从 config 传递
              imageUrl={config.imageUrl} // 从 config 传递
              boardSize={config.boardSize} // 从 config 传递
              onDragStart={handlePieceDragStart} // 处理单个拼图块的拖拽开始 
              isDragging={draggingPieceId === piece.id} // 传递当前块是否正在被拖拽
            />
          ))}

          {/* 显示游戏完成消息 (仍然在游戏区域容器内，叠加在板子上) */}
          {isCompleted && (
            <div className={styles['puzzle-game-message']}>🎉 恭喜完成拼图！</div>
          )}

        </div>
         {/* 重新开始按钮 (放在 wrapper 内，容器下方) */}
         <button className={styles['puzzle-game-btn']} onClick={resetGame}>重新开始</button>
    </div> 
  );
};

export default PuzzleGame;