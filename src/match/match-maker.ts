
import { SudokuGenerator } from "../game/sudoku-generator";

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
