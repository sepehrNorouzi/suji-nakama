import { SUDOKU_CONFIG } from '../utils/constants';

export class SudokuGenerator {
  static generate(difficulty: number = SUDOKU_CONFIG.DEFAULT_DIFFICULTY): number[] {
    const grid = SudokuGenerator.createCompleteGrid();    
    return SudokuGenerator.removeCells(grid, difficulty);
  }

  private static createCompleteGrid(): number[] {
    const grid = new Array(SUDOKU_CONFIG.GRID_SIZE).fill(SUDOKU_CONFIG.EMPTY_CELL_VALUE);
    SudokuGenerator.fillGrid(grid);
    return grid;
  }

  private static fillGrid(grid: number[]): boolean {
    for (let i = 0; i < SUDOKU_CONFIG.GRID_SIZE; i++) {
      if (grid[i] === SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        const numbers = SudokuGenerator.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
          if (SudokuGenerator.isValidPlacement(grid, i, num)) {
            grid[i] = num;
            if (SudokuGenerator.fillGrid(grid)) {
              return true;
            }
            grid[i] = SUDOKU_CONFIG.EMPTY_CELL_VALUE;
          }
        }
        return false;
      }
    }
    return true;
  }

  private static isValidPlacement(grid: number[], index: number, num: number): boolean {
    const row = Math.floor(index / SUDOKU_CONFIG.BOARD_WIDTH);
    const col = index % SUDOKU_CONFIG.BOARD_WIDTH;

    // Check row
    for (let c = 0; c < SUDOKU_CONFIG.BOARD_WIDTH; c++) {
      if (grid[row * SUDOKU_CONFIG.BOARD_WIDTH + c] === num) return false;
    }

    // Check column
    for (let r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      if (grid[r * SUDOKU_CONFIG.BOARD_WIDTH + col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    const boxCol = Math.floor(col / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    for (let r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        if (grid[r * SUDOKU_CONFIG.BOARD_WIDTH + c] === num) return false;
      }
    }

    return true;
  }

  private static removeCells(grid: number[], difficulty: number): number[] {
    const result = [...grid];
    const cellsToRemove = Math.floor(SUDOKU_CONFIG.GRID_SIZE * difficulty);
    const indices = Array.from({ length: SUDOKU_CONFIG.GRID_SIZE }, (_, i) => i);
    
    // Shuffle indices to remove random cells
    const shuffledIndices = SudokuGenerator.shuffleArray(indices);
    
    for (let i = 0; i < cellsToRemove && i < shuffledIndices.length; i++) {
      result[shuffledIndices[i]] = SUDOKU_CONFIG.EMPTY_CELL_VALUE;
    }
    
    return result;
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
