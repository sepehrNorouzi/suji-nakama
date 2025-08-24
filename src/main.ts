import * as SudokuMatch from "./match/sudoku-match-handler";

function rpcHealthcheck(
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	payload: string
): string {
	logger.info("Healthcheck RPC called");
	return JSON.stringify({ success: true });
}

let InitModule: nkruntime.InitModule = function (
	ctx: nkruntime.Context,
	logger: nkruntime.Logger,
	nk: nkruntime.Nakama,
	initializer: nkruntime.Initializer
) {
	// Register healthcheck
	initializer.registerRpc("healthcheck", rpcHealthcheck);

	initializer.registerMatch("sudoku", {
		matchInit: SudokuMatch.matchInit,
		matchJoinAttempt: SudokuMatch.matchJoinAttempt,
		matchJoin: SudokuMatch.matchJoin,
		matchLeave: SudokuMatch.matchLeave,
		matchLoop: SudokuMatch.matchLoop,
		matchTerminate: SudokuMatch.matchTerminate,
		matchSignal: SudokuMatch.matchSignal,
	});
	initializer.registerMatchmakerMatched(SudokuMatch.matchmakerMatched);

	logger.info("Nakama Sudoku match handler registered successfully.");
};

!InitModule && InitModule.bind(null);
