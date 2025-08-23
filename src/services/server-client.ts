import { SERVER_CONFIG } from '../utils/constants';
import { 
  MatchType, 
  Match, 
  MatchResult,
  PlayerGameState 
} from '../types/interfaces';

export class DjangoClient {
  private serverKey: string;
  private baseUrl: string;

  constructor() {
    this.serverKey = "server_key";
    this.baseUrl = SERVER_CONFIG.SERVER_URL;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      [SERVER_CONFIG.SERVER_KEY_HEADER]: this.serverKey
    };
  }

  async getMatchType(name: string = SERVER_CONFIG.MATCH_TYPE_NAME): Promise<MatchType | null> {
    try {
      const url = `${this.baseUrl}${SERVER_CONFIG.ENDPOINTS.GET_MATCH_TYPE}?name=${name}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get match type: ${response.statusText}`);
      }

      return await response.json() as MatchType;
    } catch (error) {
      console.error("Error getting match type:", error);
      return null;
    }
  }

  async createMatch(playerIds: number[], matchTypeId: number, gameUuid: string): Promise<Match | null> {
    try {
      const url = `${this.baseUrl}${SERVER_CONFIG.ENDPOINTS.CREATE_MATCH}`;
      const body = {
        players: playerIds,
        match_type: matchTypeId,
        uuid: gameUuid
      };

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to create match: ${response.statusText}`);
      }

      return await response.json() as Match;
    } catch (error) {
      console.error("Error creating match:", error);
      return null;
    }
  }

  async finishMatch(
    matchUuid: string, 
    winner: number, 
    players: PlayerGameState[], 
    endTime: number
  ): Promise<MatchResult | null> {
    try {
      const url = `${this.baseUrl}${SERVER_CONFIG.ENDPOINTS.FINISH_MATCH}`.replace("{uuid}", matchUuid);
      
      const playersData = players.map(player => ({
        id: player.player_id,
        board: player.private_board.cells,
        result: player.player_id === winner ? "win" : "lose"
      }));

      const body = {
        players: playersData,
        winner: winner,
        end_time: endTime
      };

      const response = await fetch(url, {
        method: "POST", 
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to finish match: ${response.statusText}`);
      }

      const result = await response.json();
      return result.result as MatchResult;
    } catch (error) {
      console.error("Error finishing match:", error);
      return null;
    }
  }

  async canPlayerJoin(matchTypeId: number, playerId: number): Promise<boolean> {
    try {
      // const url = `${this.baseUrl}${SERVER_CONFIG.ENDPOINTS.CAN_JOIN}`.replace("{id}", matchTypeId.toString());
      
      // Note: This endpoint expects user authentication, which would need to be handled
      // For now, we'll assume the game server can check this or skip the check
      return true;
    } catch (error) {
      console.error("Error checking can join:", error);
      return false;
    }
  }
}
