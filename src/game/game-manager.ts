import { GameState, PlayerGameState} from '../types/interfaces';
import { GamePhase } from '../types/enums';
import { SudokuGenerator } from './sudoku-generator';
import { SudokuValidator } from './sudoku-validator';
import { DjangoClient } from '../services/server-client';
import { StorageUtils } from '../utils/storage-util';
import { SUDOKU_CONFIG } from '../utils/constants';

export class GameManager {
  private djangoClient: DjangoClient;

  constructor() {
    this.djangoClient = new DjangoClient();
  }

  async createGame(
    nk: nkruntime.Nakama,
    ctx: nkruntime.Context,
    difficulty: number = SUDOKU_CONFIG.DEFAULT_DIFFICULTY,
    maxPlayers: number = SUDOKU_CONFIG.DEFAULT_MAX_PLAYERS
  ): Promise<GameState> {
    const gameId = nk.uuidv4();
    const initialBoard = SudokuGenerator.generate(difficulty);

    const gameState: GameState = {
      game_id: gameId,
      initial_board: { cells: initialBoard },
      players: {},
      phase: GamePhase.WAITING_FOR_PLAYERS,
      created_at: Date.now(),
      max_players: maxPlayers,
      difficulty: difficulty
    };

    StorageUtils.writeGameState(nk, gameId, gameState, ctx.userId || "");
    return gameState;
  }

  async joinGame(
    nk: nkruntime.Nakama,
    ctx: nkruntime.Context,
    gameId: string,
    profileName: string,
    avatar: string = ""
  ): Promise<{ success: boolean; error?: string; sessionId?: string; gameState?: GameState }> {
    const gameState = StorageUtils.readGameState(nk, gameId, ctx.userId || "");
    
    if (!gameState) {
      return { success: false, error: "Game not found" };
    }

    const playerCount = Object.keys(gameState.players).length;
    if (playerCount >= gameState.max_players) {
      return { success: false, error: "Game is full" };
    }

    const existingPlayer = Object.values(gameState.players)
      .find((p: any) => p.user_id === ctx.userId);
    
    if (existingPlayer) {
      return { success: false, error: "Already in game" };
    }

    const sessionId = nk.uuidv4();
    const playerState: PlayerGameState = {
      id: sessionId,
      user_id: ctx.userId || "",
      player_id: 0,
      profile_name: profileName,
      avatar: avatar,
      private_board: { cells: [...gameState.initial_board.cells] },
      public_board: { cells: [...gameState.initial_board.cells] },
      is_ready: false,
      move_count: 0,
      start_time: Date.now()
    };

    gameState.players[sessionId] = playerState;

    if (Object.keys(gameState.players).length === gameState.max_players) {
      await this.startGame(nk, ctx, gameState);
    }

    StorageUtils.writeGameState(nk, gameId, gameState, ctx.userId || "");
    return { success: true, sessionId, gameState };
  }

  private async startGame(nk: nkruntime.Nakama, ctx: nkruntime.Context, gameState: GameState): Promise<void> {
    try {
      // Get Sudoku match type from Django
      const matchType = await this.djangoClient.getMatchType();
      if (!matchType) {
        console.error("Failed to get Sudoku match type from Django");
        return;
      }

      // Extract player IDs for Django (this would need proper mapping from Nakama user to Django player)
      const playerIds = Object.values(gameState.players).map(p => p.player_id).filter(id => id > 0);
      
      if (playerIds.length === gameState.max_players) {
        // Create match in Django
        const djangoMatch = await this.djangoClient.createMatch(playerIds, matchType.id, gameState.game_id);
        if (djangoMatch) {
          gameState.match_uuid = djangoMatch.uuid;
          gameState.match_type_id = matchType.id;
        }
      }

      gameState.phase = GamePhase.MATCH_ACTIVE;
      
      // Set start time for all players
      Object.values(gameState.players).forEach(player => {
        player.start_time = Date.now();
        player.is_ready = true;
      });

    } catch (error) {
      console.error("Error starting game:", error);
    }
  }

  makeMove(
    nk: nkruntime.Nakama,
    ctx: nkruntime.Context,
    gameId: string,
    sessionId: string,
    index: number,
    value: number
  ): { success: boolean; error?: string; gameComplete?: boolean; winner?: string } {
    const gameState = StorageUtils.readGameState(nk, gameId, ctx.userId || "");
    
    if (!gameState || gameState.phase !== GamePhase.MATCH_ACTIVE) {
      return { success: false, error: "Game not active" };
    }

    const player = gameState.players[sessionId];
    if (!player) {
      return { success: false, error: "Player not found" };
    }

    // Validate the move
    const isValid = SudokuValidator.isValidMove(
      index,
      gameState.initial_board.cells,
      player.private_board.cells,
      value
    );

    if (!isValid) {
      return { success: false, error: "Invalid move" };
    }

    // Apply the move
    player.private_board.cells[index] = value;
    player.public_board.cells[index] = SUDOKU_CONFIG.MASK_CELL_VALUE; // Show that cell is filled to others
    player.move_count++;

    // Check if game is complete
    const isComplete = SudokuValidator.isGameComplete(player.private_board.cells);
    
    if (isComplete) {
      player.completion_time = Date.now();
      gameState.winner_id = sessionId;
      gameState.phase = GamePhase.MATCH_ENDED;
      
      // Finish the game and notify Django
      this.finishGame(nk, ctx, gameState);
      
      StorageUtils.writeGameState(nk, gameId, gameState, ctx.userId || "");
      return { success: true, gameComplete: true, winner: sessionId };
    }

    StorageUtils.writeGameState(nk, gameId, gameState, ctx.userId || "");
    return { success: true };
  }

  private async finishGame(nk: nkruntime.Nakama, ctx: nkruntime.Context, gameState: GameState): Promise<void> {
    if (!gameState.match_uuid || !gameState.winner_id) {
      return;
    }

    try {
      const winner = gameState.players[gameState.winner_id];
      const endTime = Date.now();

      // Send results to Django
      const result = await this.djangoClient.finishMatch(
        gameState.match_uuid,
        winner.player_id,
        Object.values(gameState.players),
        endTime
      );

      if (result) {
        console.log("Game finished successfully in Django:", result.id);
      }

    } catch (error) {
      console.error("Error finishing game in Django:", error);
    }
  }

  getGameState(nk: nkruntime.Nakama, ctx: nkruntime.Context, gameId: string): GameState | null {
    return StorageUtils.readGameState(nk, gameId, ctx.userId || "");
  }

  getPlayerState(nk: nkruntime.Nakama, ctx: nkruntime.Context, gameId: string, sessionId: string): PlayerGameState | null {
    const gameState = this.getGameState(nk, ctx, gameId);
    return gameState?.players[sessionId] || null;
  }
}
