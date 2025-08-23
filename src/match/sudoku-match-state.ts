import { GamePhase } from '../types/enums';
import { SudokuBoard } from '../types/interfaces';

export interface SudokuMatchState {
  match_id: string;
  initial_board: SudokuBoard;
  players: { [userId: string]: SudokuPlayerState };
  phase: GamePhase;
  winner_id?: string;
  created_at: number;
  match_uuid?: string;
  match_type_id?: number;
}

export interface SudokuPlayerState {
  user_id: string;
  profile_name: string;
  avatar: string;
  private_board: SudokuBoard;
  public_board: SudokuBoard;
  move_count: number;
  start_time: number;
  completion_time?: number;
  player_id?: number;
}
