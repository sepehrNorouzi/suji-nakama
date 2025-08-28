import { SudokuGenerator } from "../game/sudoku-generator";
import { SudokuValidator } from "../game/sudoku-validator";
import { DjangoClient, server_clien } from "../services/server-client";
import { SudokuMatchState, SudokuPlayerState } from "./sudoku-match-state";
import { GamePhase } from "../types/enums";
import { GAME_CONFIG, SUDOKU_CONFIG } from "../utils/constants";

import { MESSAGES } from "../utils/constants";
import { PlayerGameState } from "../types/interfaces";
import { ClientOpCodes, ServerOpCodes } from "./op-codes";
import { StorageUtils } from "../utils/storage-util";

export function matchInit(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	params: { [key: string]: string }
): { state: nkruntime.MatchState; tickRate: number; label: string } {
	logger.info("Initializing Sudoku match");

	const difficulty =
		parseFloat(params.difficulty) || SUDOKU_CONFIG.DEFAULT_DIFFICULTY;
	const initialBoard = SudokuGenerator.generate(difficulty);

	const body = {
		event: "game_started",
		event_id: nk.uuidv4(),
		match_id: ctx.matchId,
		region: "global",
		players: [],
		initial_board_hash: nk.sha256Hash(params.initial_board),
		ts: new Date().toISOString(),
	};

	const url = ctx.env["PUBLISHER_URL"];
	const token = ctx.env["PUBLISHER_AUTH_TOKEN"];

	logger.debug(`URL: ${url}`);
	logger.debug(`TOKEN: ${token}`);


	const state: SudokuMatchState = {
		match_id: ctx.matchId || "",
		initial_board: { cells: initialBoard },
		players: {},
		phase: GamePhase.WAITING_FOR_PLAYERS,
		created_at: Date.now(),
	};

	const res = nk.httpRequest(
		url + "/v1/events/game-started",
		'post',
		{ "Content-Type": "application/json", "Authorization": "Bearer " + token, "X-Idempotency-Key": body.event_id },
		JSON.stringify(body),
		0.5
	  );

	StorageUtils.writeGameState(nk, ctx.matchId, state, ctx.userId);

	return {
		state: state as nkruntime.MatchState,
		tickRate: 10,
		label: "sudoko",
	};
}

export function matchJoinAttempt(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	tick: number,
	state: nkruntime.MatchState,
	presence: nkruntime.Presence,
	metadata: { [key: string]: any }
): {
	state: nkruntime.MatchState;
	accept: boolean;
	rejectMessage?: string;
} | null {
	logger.info(`Player ${presence.userId} attempting to join match`);

	const matchState = state as any as SudokuMatchState;

	const playerCount = Object.keys(matchState.players).length;
	if (playerCount >= SUDOKU_CONFIG.DEFAULT_MAX_PLAYERS) {
		return {
			state: state,
			accept: false,
			rejectMessage: "Match is full",
		};
	}

	if (matchState.players[presence.userId]) {
		return {
			state: state,
			accept: false,
			rejectMessage: "Already in match",
		};
	}

	return {
		state: state,
		accept: true,
	};
}

export function matchJoin(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	tick: number,
	state: nkruntime.MatchState,
	presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
	logger.info(
		`Players joined match: ${presences.map((p) => p.userId).join(", ")}`
	);

	const matchState = state as any as SudokuMatchState;

	// Add new players
	presences.forEach((presence) => {
		if (!matchState.players[presence.userId]) {
			const playerState: SudokuPlayerState = {
				user_id: presence.userId,
				profile_name:
					presence.username || `Player_${presence.userId.slice(-4)}`,
				avatar: "",
				private_board: { cells: [...matchState.initial_board.cells] },
				public_board: {
					cells: [...matchState.initial_board.cells],
				},
				move_count: 0,
				start_time: Date.now(),
				wrong_move_cnt: 0,
				move_banned: null
			};

			matchState.players[presence.userId] = playerState;
		}
	});

	const playerCount = Object.keys(matchState.players).length;
	if (
		playerCount >= SUDOKU_CONFIG.DEFAULT_MAX_PLAYERS &&
		matchState.phase === GamePhase.WAITING_FOR_PLAYERS
	) {
		logger.debug("WE ARE HERE")
		matchState.phase = GamePhase.MATCH_ACTIVE;
		startMatch(ctx, logger, nk, dispatcher, matchState);
	}

	return { state: matchState as nkruntime.MatchState };
}

export function matchLeave(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	tick: number,
	state: nkruntime.MatchState,
	presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
	logger.info(
		`Players left match: ${presences.map((p) => p.userId).join(", ")}`
	);

	const matchState = state as any as SudokuMatchState;

	if (matchState.phase === GamePhase.MATCH_ACTIVE) {
		presences.forEach((presence) => {
			if (matchState.players[presence.userId]) {
				logger.info(`Player ${presence.userId} forfeited by leaving`);
				// Could set their completion time to a penalty or mark as forfeit
			}
		});
	}

	// Remove players from state
	presences.forEach((presence) => {
		delete matchState.players[presence.userId];
	});

	// If no players left, match should end
	if (Object.keys(matchState.players).length === 0) {
		return null; // This will terminate the match
	}

	return { state: matchState as nkruntime.MatchState };
}

export function matchLoop(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	tick: number,
	state: nkruntime.MatchState,
	messages: nkruntime.MatchMessage[]
): { state: nkruntime.MatchState } | null {
	const matchState = state as any as SudokuMatchState;
	// Process incoming messages
	messages.forEach((message) => {
		switch (message.opCode) {
			case ClientOpCodes.FILL:
				handleFillMessage(ctx, logger, nk, dispatcher, matchState, message);
				break;
			case ClientOpCodes.COMPLETE: // COMPLETE submission
				handleCompleteMessage(ctx, logger, nk, dispatcher, matchState, message);
				break;
			case ClientOpCodes.MATCH_STATE:
				handleRequestState(ctx, logger, nk, dispatcher, matchState, message)
			default:
				logger.warn(`Unknown message opCode: ${message.opCode}`);
				break
		}
	});

	return { state: matchState as nkruntime.MatchState };
}

export function matchTerminate(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	tick: number,
	state: nkruntime.MatchState,
	graceSeconds: number
): { state: nkruntime.MatchState } | null {
	logger.info("Match terminating");

	const matchState = state as any as SudokuMatchState;

	// Send final results to Django if match was active
	if (matchState.match_uuid) {
		finishDjangoMatch(ctx, logger, nk, matchState);
	}

	return null;
}

export function matchSignal(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    data: string
  ): { state: nkruntime.MatchState } | null {
    logger.info("Match signal received");
    
    const matchState = state as any as SudokuMatchState;
    
    try {
      const signalData = JSON.parse(data);
      
      switch (signalData.type) {
        case "pause_match":
          // Handle pause logic if needed
          logger.info("Match pause signal received");
          break;
        case "resume_match":
          // Handle resume logic if needed
          logger.info("Match resume signal received");
          break;
        default:
          logger.warn(`Unknown signal type: ${signalData.type}`);
      }
      
    } catch (error) {
      logger.error("Error handling match signal:", error);
    }
    
    return { state: matchState as nkruntime.MatchState };
}


export function matchmakerMatched(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    entries: nkruntime.MatchmakerResult[]
): string {
    logger.info("🎯 MATCHMAKER MATCHED! Creating Sudoku match...");
    logger.info("👥 Matched " + entries.length + " players");
    for (var i = 0; i < entries.length; i++) {
        logger.info("   Player " + (i + 1) + ": " + entries[i].presence.username);
    }
    
    try {
		const initial_board = SudokuGenerator.generate(0.5);
        const matchId = nk.matchCreate("sudoku", {initial_board});
		logger.info("INITIAL_BOARD: " + initial_board.toString())
        logger.info("✅ Created Sudoku match for matchmaker: " + matchId);
        return matchId;
    } catch (error) {
        logger.error("❌ Error in matchmaker matched: " + error);
        return "";
    }
}

async function startMatch(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	dispatcher: nkruntime.MatchDispatcher,
	matchState: SudokuMatchState
): Promise<void> {
	logger.info("Starting Sudoku match");

	try {
		// Create Django match
		const djangoClient = new DjangoClient();
		const matchType = await djangoClient.getMatchType();

		if (matchType) {
			// Get player IDs (would need proper mapping from Nakama user to Django player)
			const playerIds = Object.values(matchState.players)
				.map((p) => p.player_id || -1)
				.filter((id) => id && id > 0);

			if (playerIds.length === Object.keys(matchState.players).length) {
				const djangoMatch = await djangoClient.createMatch(
					playerIds,
					matchType.id,
					matchState.match_id
				);
				if (djangoMatch) {
					matchState.match_uuid = djangoMatch.uuid;
					matchState.match_type_id = matchType.id;
					logger.info(`Django match created: ${djangoMatch.uuid}`);
				}
			}
		}
	} catch (error) {
		logger.error("Error creating Django match:", error);
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

function handleFillMessage(
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

function handleCompleteMessage(
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

function handleGameCompletion(
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

async function finishDjangoMatch(
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

function handleRequestState(
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