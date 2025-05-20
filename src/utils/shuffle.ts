import { type Piece } from "../types/puzzle";

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
 * 判断游戏成功与否，即检查所有块是否都已吸附到正确位置
 * @param pieces 拼图块数组
 * @returns 是否全部回到正确位置
 */
export const checkCompleted = (pieces: Piece[]): boolean => {
  return pieces.every(p => p.isSnapped);
};