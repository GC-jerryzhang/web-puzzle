export interface Piece {
  id: number;          // 唯一标识
  correctIndex: number;// 正确位置索引 (0 到 gridSize*gridSize - 1)
  x: number;           // 当前的 X 坐标 (相对于父容器)
  y: number;           // 当前的 Y 坐标 (相对于父容器)
  isSnapped: boolean;  // 是否已经吸附到正确位置
}

export interface PuzzleConfig {
  gridSize: number;    // 网格尺寸 
  imageUrl: string;    // 拼图图片路径 
  boardSize: number;   // 拼图板的像素尺寸 
  playAreaWidth: number; // 整个游戏区域的宽度
  playAreaHeight: number; // 整个游戏区域的高度
  snapTolerance: number; // 吸附容差 (像素)
}