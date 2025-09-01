import { SudokuGenerator } from "../game/sudoku-generator";
import { SudokuMatchState, SudokuPlayerState } from "./sudoku-match-state";
import { GamePhase } from "../types/enums";
import { SUDOKU_CONFIG } from "../utils/constants";
import { ClientOpCodes} from "./op-codes";
import { StorageUtils } from "../utils/storage-util";
import { finishDjangoMatch, handleCompleteMessage, handleFillMessage, handleRequestState, startMatch } from '../match/sudoku-match-handler';


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


    const state: SudokuMatchState = {
        match_id: ctx.matchId || "",
        initial_board: { cells: initialBoard },
        players: {},
        phase: GamePhase.WAITING_FOR_PLAYERS,
        created_at: Date.now(),
    };
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
                avatar: '',
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
