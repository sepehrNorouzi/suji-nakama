import { SudokuValidator } from "../game/sudoku-validator";
import { DjangoClient } from "../services/server-client";
import { SudokuMatchState } from "./sudoku-match-state";
import { GamePhase } from "../types/enums";
import { GAME_CONFIG, SUDOKU_CONFIG } from "../utils/constants";

import { MESSAGES } from "../utils/constants";
import { PlayerGameState } from "../types/interfaces";
import { ServerOpCodes } from "./op-codes";

export async function startMatch(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState
): Promise<void> {
	logger.info("Starting Sudoku match");
	

	try {
		const initialBoardCells = matchState.initial_board.cells;
    if (!Array.isArray(initialBoardCells) || initialBoardCells.length === 0) {
      logger.error("Invalid initial board data:", initialBoardCells);
      return;
    }

    const body = {
      event: "game_started",
      event_id: nk.uuidv4(),
      match_id: ctx.matchId,
      region: "global",
      players: [],
      initial_board_hash: nk.sha256Hash(initialBoardCells.join(',')),
      ts: Date.now(),
    };

    const url = ctx.env["PUBLISHER_URL"];
    const token = ctx.env["PUBLISHER_AUTH_TOKEN"];

    logger.debug(`[MATCHJOIN.STARTMATCH] URL: ${url}`);
    logger.debug(`[MATCHJOIN.STARTMATCH] TOKEN: ${token}`);

    // HTTP request to the publisher
    const res = nk.httpRequest(
      url + "/v1/events/game-started",
      'post',
      {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "X-Idempotency-Key": body.event_id
      },
      JSON.stringify(body),
      5000
    );

    // Log the response from the HTTP request
    logger.debug(`[MATCHJOIN.STARTMATCH] Response: ${JSON.stringify(res)}`);		
	
	} catch (error) {
		logger.error("Error creating Django match:", error.message || error);
		logger.error("Error creating Django match:", error.stack);
	}

	const startTime = new Date().getTime();
	Object.values(matchState.players).forEach((player) => {
		player.start_time = startTime;
	});

	// Broadcast match started
	const message = {
		type: MESSAGES.SERVER.MATCH_STARTED,
		initial_board: matchState.initial_board.cells,
		players: Object.keys(matchState.players).length,
	};

	dispatcher.broadcastMessage(ServerOpCodes.MATCH_STARTED, JSON.stringify(message));
}

export function handleFillMessage(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState,
	message: nkruntime.MatchMessage
): void {
	if (matchState.phase !== GamePhase.MATCH_ACTIVE) {
		// Send error to player
		const errorMsg = {
			type: MESSAGES.SERVER.ERROR,
			message: "Game is not active",
		};
		dispatcher.broadcastMessage(ServerOpCodes.ERROR, JSON.stringify(errorMsg), [message.sender]);
		return;
	}
	const datetime = new Date().getTime();
	const player = matchState.players[message.sender.userId];
	if (!player) {
		return;
	}
	if (player.move_banned) {
		// logger.debug("HERE IS THE SHIT: " + typeof player.move_banned)
		logger.debug("HERE IS THE Othershit: " +  Object.keys(player.move_banned).join(', '))
		logger.debug("HERE IS THE Banned: " +  player.move_banned)
		const banned_until = player.move_banned;
		logger.debug("HERE IS THE BANNED UNTIL: " +  banned_until)
		if(banned_until > datetime) {
			const invalidMsg = {
				type: MESSAGES.SERVER.INVALID_MOVE,
				error: `You are banned for ${(banned_until - datetime)}`,
				banned_until: player.move_banned
			};
	
			dispatcher.broadcastMessage(ServerOpCodes.INVALID_MOVE, JSON.stringify(invalidMsg), [
				message.sender,
			]);
			return
		}
	}
	try {
		logger.debug(`RECIED DATA in HANDLE FILL : ${message.data}`)
		// const data = decodeMessage(message.data);
		const str_data = nk.binaryToString(message.data);
		const data = JSON.parse(str_data);
		logger.debug(`RECIED DATA: ${JSON.stringify(data)}`)
		if (typeof data.index === "undefined" || typeof data.num === "undefined") {
			logger.error("Invalid message format: missing 'index' or 'num'");
			return;
		}

		const { index, num } = data;
		logger.debug(`RECIEVED DATA index: ${index}, num: ${num}`)

		// Validate move
		const isValid = SudokuValidator.isValidMove(
			index,
			matchState.initial_board.cells,
			player.private_board.cells,
			num
		);
		logger.debug(`After is valid Move, ${isValid}`)
		if (isValid) {
			// Apply move
			logger.debug(`In is_valid condition`)
			player.private_board.cells[index] = num;
			player.public_board.cells[index] = SUDOKU_CONFIG.MASK_CELL_VALUE;
			player.move_count += 1;
			logger.debug(`After player.move_count += 1`)
			// Broadcast move to other players
			const moveMsg = {
				type: MESSAGES.SERVER.PLAYER_MOVED,
				player: message.sender.userId,
				index: index,
			};
			dispatcher.broadcastMessage(ServerOpCodes.MOVE_MADE, JSON.stringify(moveMsg));
		} else {
			logger.debug(`In not is_valid condition`)
			const now = new Date().getTime();
			const banned_time = GAME_CONFIG.WRONG_MOVE_PENALTY * (player.wrong_move_cnt || 1);
			player.wrong_move_cnt += 1;
			player.move_banned = now + (banned_time * 1000);
			const invalidMsg = {
				type: MESSAGES.SERVER.INVALID_MOVE,
				error: `Move at index ${index} is not valid`,
				banned_until: player.move_banned
			};
			dispatcher.broadcastMessage(ServerOpCodes.INVALID_MOVE, JSON.stringify(invalidMsg), [
				message.sender,
			]);
			logger.debug(`Done`)

		}
	} catch (error) {
		logger.error("Error handling fill message:", error);
	}
}

export function handleCompleteMessage(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState,
	message: nkruntime.MatchMessage
): void {
	const player = matchState.players[message.sender.userId];
	if (!player) return;

	try {
		const data = JSON.parse(nk.binaryToString(message.data));
		const { solution } = data;

		if (SudokuValidator.isValidSolution(solution)) {
			player.private_board.cells = solution;
			player.completion_time = Date.now();
			handleGameCompletion(
				ctx,
				logger,
				nk,
				dispatcher,
				matchState,
				message.sender.userId
			);
		}
	} catch (error) {
		logger.error("Error handling complete message:", error);
	}
}

export function handleGameCompletion(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState,
	winnerId: string
): void {
	logger.info(`Game completed by player: ${winnerId}`);

	matchState.winner_id = winnerId;
	matchState.phase = GamePhase.MATCH_ENDED;
	matchState.players[winnerId].completion_time = Date.now();

	const endMsg = {
		type: MESSAGES.SERVER.MATCH_ENDED,
		winner: winnerId,
		completion_time: matchState.players[winnerId].completion_time,
	};
	dispatcher.broadcastMessage(ServerOpCodes.MATCH_ENDED, JSON.stringify(endMsg));

	finishDjangoMatch(ctx, logger, nk, matchState);
}

export async function finishDjangoMatch(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	matchState: SudokuMatchState
): Promise<void> {
	if (!matchState.match_uuid || !matchState.winner_id) {
		return;
	}

	try {
		const djangoClient = new DjangoClient();
		const winner = matchState.players[matchState.winner_id];
		const endTime = Date.now();

		const result = await djangoClient.finishMatch(
			matchState.match_uuid,
			winner.player_id || 0,
			Object.values(matchState.players) as PlayerGameState[],
			endTime
		);

		if (result) {
			logger.info(`Django match finished successfully: ${result.id}`);
		}
	} catch (error) {
		logger.error("Error finishing Django match:", error);
	}
}

export function handleRequestState(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState,
	message: nkruntime.MatchMessage
) {
	logger.info(`Requested Match state from ${message.sender.persistence}`)
	let m_state = {
		match_id: matchState.match_id,
		initial_board: { cells: JSON.parse(JSON.stringify(matchState.initial_board.cells)) },
		players: {},
		phase: matchState.phase,
		match_uuid: matchState.match_uuid,
	}

	for (const [key, value] of Object.entries(matchState.players)) {
		if(key == message.sender.userId) {
			m_state.players[key] = {
				user_id: value.user_id,
				profile_name: value.profile_name,
				move_count: value.move_count,
				start_time: value.start_time,
				completion_time: value.completion_time,
				player_id: value.player_id,
				move_banned: value.move_banned,
				wrong_move_cnt: value.wrong_move_cnt,
				private_board: JSON.parse(JSON.stringify(value.private_board)),
				public_board: JSON.parse(JSON.stringify(value.public_board)),
			}
		}
		else {
			m_state.players[key] = {
				user_id: value.user_id,
				profile_name: value.profile_name,
				move_count: value.move_count,
				start_time: value.start_time,
				completion_time: value.completion_time,
				player_id: value.player_id,
				move_banned: value.move_banned,
				wrong_move_cnt: value.wrong_move_cnt,
				public_board: JSON.parse(JSON.stringify(value.public_board)),
			}
	 	}
	}

	dispatcher.broadcastMessage(ServerOpCodes.STATE_ACK, JSON.stringify(m_state), [message.sender]);
}
