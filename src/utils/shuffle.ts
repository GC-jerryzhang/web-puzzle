import type { Piece,  PuzzleConfig } from "../types/puzzle";

/**
 * 洗牌函数，返回新数组，不修改原数组
 * 洗牌算法：Fisher-Yates Shuffle
 * @param array 原数组
 * @returns 洗牌后的新数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = array.slice(); // 拷贝一份
  for (let i = result.length - 1; i > 0; i--) {
    // 在 0~i 之间随机一个下标
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 判断游戏成功与否，即检查所有块是否都已吸附到正确位置，不仅要回到正确位置，还要确保没有被打乱
 * @param pieces 拼图块数组
 * @returns 是否全部回到正确位置
 */
export function checkCompleted(
    pieces: Piece[],
    config: PuzzleConfig,
    boardRelativePosition: { x: number, y: number } | null
): boolean {
    // 如果板子位置信息未知，无法判断是否完成
    if (!boardRelativePosition) {
        return false;
    }

    const pieceCount = config.gridSize * config.gridSize;
    // 必须有足够数量的拼图块才能完成
    if (pieces.length !== pieceCount) {
        return false;
    }

    const pieceSize = config.boardSize / config.gridSize;
    const boardPos = boardRelativePosition; // 板子相对于容器的左上角位置

    // 遍历所有拼图块
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        // 计算当前块相对于板子左上角的坐标
        const pieceXRelativeToBoard = piece.x - boardPos.x;
        const pieceYRelativeToBoard = piece.y - boardPos.y;

        // 检查块是否在板子范围内 (可以使用更严格的中心点检查，这里先用左上角大致判断)
        if (pieceXRelativeToBoard < 0 || pieceXRelativeToBoard >= config.boardSize ||
            pieceYRelativeToBoard < 0 || pieceYRelativeToBoard >= config.boardSize) {
            console.log(`Piece ${piece.id} is outside board bounds.`);
            return false; // 有块跑出去了
        }

        // 根据块的当前位置计算它所在的网格列和行 (基于其左上角，或者更精确的使用中心点)
        // 使用中心点计算更符合吸附逻辑中对中心点的处理
        const pieceCenterXRelativeToBoard = pieceXRelativeToBoard + pieceSize / 2;
        const pieceCenterYRelativeToBoard = pieceYRelativeToBoard + pieceSize / 2;

        const currentGridCol = Math.floor(pieceCenterXRelativeToBoard / pieceSize);
        const currentGridRow = Math.floor(pieceCenterYRelativeToBoard / pieceSize);

        // 检查计算出的网格索引是否在有效范围内
        if (currentGridCol < 0 || currentGridCol >= config.gridSize ||
            currentGridRow < 0 || currentGridRow >= config.gridSize) {
            console.log(`Piece ${piece.id} center maps to invalid grid index.`);
            return false; // 中心点落在了无效的网格区域
        }

        // 计算当前位置对应的网格索引
        const currentGridIndex = currentGridRow * config.gridSize + currentGridCol;

        // 关键检查：判断当前块是否在它“正确”的网格索引上
        if (piece.correctIndex !== currentGridIndex) {
            console.log(`Piece ${piece.id} (correctIndex: ${piece.correctIndex}) is in wrong grid index: ${currentGridIndex}`);
            return false; // 找到一个不在正确位置的块
        }

    }

    // 如果所有块都通过了上面的检查，说明所有块都在其正确的网格位置上
    console.log('All pieces are in their correct grid cells. Puzzle completed.');
    return true;
}