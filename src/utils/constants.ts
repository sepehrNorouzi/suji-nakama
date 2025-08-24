export const SUDOKU_CONFIG = {
	GRID_SIZE: 81,
	BOARD_WIDTH: 9,
	BOARD_HEIGHT: 9,
	BOX_SIZE: 3,
	DEFAULT_DIFFICULTY: 0.4,
	DEFAULT_MAX_PLAYERS: 2,
	EMPTY_CELL_VALUE: 0,
	MASK_CELL_VALUE: -2,
};

export const SERVER_CONFIG = {
	SERVER_URL: "http://localhost:8000",
	SERVER_KEY_HEADER: "X-Suji-Server-Key",
	MATCH_TYPE_NAME: "Sudoku",
	ENDPOINTS: {
		GET_MATCH_TYPE: "/api/match_type/get_by_name/",
		CREATE_MATCH: "/api/match/create/",
		FINISH_MATCH: "/api/match/{uuid}/finish/",
		CAN_JOIN: "/api/match_type/{id}/can_join/",
	},
};

export const STORAGE_KEYS = {
	GAME_PREFIX: "sudoku_game:",
	PLAYER_PREFIX: "sudoku_player:",
	MATCH_PREFIX: "sudoku_match:",
};

export const RPC_IDS = {
	CREATE_GAME: "create_sudoku_game",
	JOIN_GAME: "join_sudoku_game",
	LEAVE_GAME: "leave_sudoku_game",
	MAKE_MOVE: "make_sudoku_move",
	SUBMIT_SOLUTION: "submit_sudoku_solution",
	GET_GAME_STATE: "get_sudoku_game_state",
	GET_PLAYER_STATE: "get_sudoku_player_state",
};

export const MESSAGES = {
	CLIENT: {
		FILL: "fill",
		COMPLETE: "complete",
	},
	SERVER: {
		MATCH_STARTED: "match_started",
		PLAYER_MOVED: "player_moved",
		INVALID_MOVE: "invalid_move",
		MATCH_ENDED: "match_ended",
		ERROR: "error",
	},
};

export const GAME_CONFIG = {
	WRONG_MOVE_PENALTY: 5,
}
