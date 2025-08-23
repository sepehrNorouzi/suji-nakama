import { SUDOKU_CONFIG } from '../utils/constants';

export class SudokuValidator {
  static isValidMove(index: number, initialBoard: number[], currentBoard: number[], moveValue: number): boolean {
    if (initialBoard[index] !== SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
      return false;
    }

    if (moveValue < 1 || moveValue > 9) {
      return false;
    }
    const tempBoard = [...currentBoard];
    tempBoard[index] = moveValue;
    return SudokuValidator.isValidPlacement(tempBoard, index, moveValue);
  }

  private static isValidPlacement(board: number[], index: number, value: number): boolean {
    const row = Math.floor(index / SUDOKU_CONFIG.BOARD_WIDTH);
    const col = index % SUDOKU_CONFIG.BOARD_WIDTH;

    // Check row conflict
    for (let c = 0; c < SUDOKU_CONFIG.BOARD_WIDTH; c++) {
      const checkIndex = row * SUDOKU_CONFIG.BOARD_WIDTH + c;
      if (checkIndex !== index && board[checkIndex] === value) {
        return false;
      }
    }

    // Check column conflict
    for (let r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      const checkIndex = r * SUDOKU_CONFIG.BOARD_WIDTH + col;
      if (checkIndex !== index && board[checkIndex] === value) {
        return false;
      }
    }

    // Check 3x3 box conflict
    const boxRow = Math.floor(row / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    const boxCol = Math.floor(col / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    for (let r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        const checkIndex = r * SUDOKU_CONFIG.BOARD_WIDTH + c;
        if (checkIndex !== index && board[checkIndex] === value) {
          return false;
        }
      }
    }

    return true;
  }

  static isGameComplete(board: number[]): boolean {
    // Check if all cells are filled
    for (let i = 0; i < SUDOKU_CONFIG.GRID_SIZE; i++) {
      if (board[i] === SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        return false;
      }
    }

    // Validate the complete solution
    return SudokuValidator.isValidSolution(board);
  }

  static isValidSolution(board: number[]): boolean {
    // Check all rows, columns, and boxes
    for (let i = 0; i < SUDOKU_CONFIG.BOARD_WIDTH; i++) {
      if (!SudokuValidator.isValidGroup(SudokuValidator.getRow(board, i)) ||
          !SudokuValidator.isValidGroup(SudokuValidator.getColumn(board, i)) ||
          !SudokuValidator.isValidGroup(SudokuValidator.getBox(board, i))) {
        return false;
      }
    }
    return true;
  }

  private static getRow(board: number[], row: number): number[] {
    return board.slice(row * SUDOKU_CONFIG.BOARD_WIDTH, (row + 1) * SUDOKU_CONFIG.BOARD_WIDTH);
  }

  private static getColumn(board: number[], col: number): number[] {
    const column = [];
    for (let r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      column.push(board[r * SUDOKU_CONFIG.BOARD_WIDTH + col]);
    }
    return column;
  }

  private static getBox(board: number[], boxIndex: number): number[] {
    const box = [];
    const boxRow = Math.floor(boxIndex / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    const boxCol = (boxIndex % SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    
    for (let r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        box.push(board[r * SUDOKU_CONFIG.BOARD_WIDTH + c]);
      }
    }
    return box;
  }

  private static isValidGroup(group: number[]): boolean {
    const seen = new Set();
    for (const num of group) {
      if (num !== SUDOKU_CONFIG.EMPTY_CELL_VALUE && seen.has(num)) {
        return false;
      }
      if (num !== SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        seen.add(num);
      }
    }
    return true;
  }
}
