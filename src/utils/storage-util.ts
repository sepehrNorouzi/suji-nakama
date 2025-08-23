import { STORAGE_KEYS } from './constants';

export class StorageUtils {
  static getGameKey(gameId: string): string {
    return `${STORAGE_KEYS.GAME_PREFIX}${gameId}`;
  }

  static getPlayerKey(gameId: string, sessionId: string): string {
    return `${STORAGE_KEYS.PLAYER_PREFIX}${gameId}:${sessionId}`;
  }

  static getMatchKey(matchUuid: string): string {
    return `${STORAGE_KEYS.MATCH_PREFIX}${matchUuid}`;
  }

  static writeGameState(
    nk: nkruntime.Nakama,
    gameId: string,
    gameState: any,
    userId: string
  ): void {
    nk.storageWrite([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      value: gameState,
      userId: userId
    }]);
  }

  static readGameState(
    nk: nkruntime.Nakama,
    gameId: string,
    userId: string
  ): any | null {
    const data = nk.storageRead([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      userId: userId
    }]);

    return data.length > 0 ? data[0].value : null;
  }

  static deleteGameState(
    nk: nkruntime.Nakama,
    gameId: string,
    userId: string
  ): void {
    nk.storageDelete([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      userId: userId
    }]);
  }
}
