import {GamePhase} from './enums'

export interface Player {
	id: number;
	profile_name: string;
	avatar?: string;
	score: number;
	xp: number;
	cup: number;
}

//  Match Type interfaces
export interface Cost {
	currencies: Array<{
		currency: {
			id: number;
			name: string;
			type: string;
		};
		amount: number;
	}>;
}

export interface RewardPackage {
	id: number;
	name: string;
	rewards: Array<{
		currency: {
			id: number;
			name: string;
			type: string;
		};
		amount: number;
	}>;
}

export interface MatchType {
	id: number;
	name: string;
	min_xp: number;
	min_cup: number;
	min_score: number;
	config: Record<string, any>;
	winner_xp: number;
	winner_cup: number;
	winner_score: number;
	loser_xp: number;
	loser_cup: number;
	loser_score: number;
	entry_cost: Cost;
	winner_package: RewardPackage;
	loser_package: RewardPackage;
}

//  Match interfaces
export interface Match {
	uuid: string;
	players: Player[];
	match_type: {
		id: number;
		name: string;
	};
}

export interface MatchResult {
	id: number;
	match_uuid: string;
	match_type: number;
	history: Record<string, any>;
	players: Player[];
}

// Game-specific interfaces
export interface SudokuBoard {
	cells: number[]; // 81 numbers (9x9 grid)
}

export interface PlayerGameState {
	id: string; // session ID in Nakama
	user_id: string; // Nakama user ID
	player_id: number; //  player ID
	profile_name: string;
	avatar: string;
	private_board: SudokuBoard; // Player's actual progress
	public_board: SudokuBoard; // What others can see (masked)
	is_ready: boolean;
	move_count: number;
	start_time: number;
	completion_time?: number;
}

export interface GameState {
	game_id: string;
	match_uuid?: string; //  match UUID
	match_type_id?: number; //  match type ID
	initial_board: SudokuBoard;
	players: { [sessionId: string]: PlayerGameState };
	phase: GamePhase;
	winner_id?: string;
	created_at: number;
	max_players: number;
	difficulty: number;
}

// API Request/Response interfaces
export interface CreateGameRequest {
	difficulty?: number;
	max_players?: number;
	match_type_name?: string;
}

export interface JoinGameRequest {
	game_id: string;
	profile_name: string;
	avatar?: string;
}

export interface MakeMoveRequest {
	game_id: string;
	index: number;
	value: number;
}

export interface SubmitSolutionRequest {
	game_id: string;
	solution: number[];
}
