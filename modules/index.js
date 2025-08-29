function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}
typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var SUDOKU_CONFIG = {
  GRID_SIZE: 81,
  BOARD_WIDTH: 9,
  BOARD_HEIGHT: 9,
  BOX_SIZE: 3,
  DEFAULT_DIFFICULTY: 0.4,
  DEFAULT_MAX_PLAYERS: 2,
  EMPTY_CELL_VALUE: 0,
  MASK_CELL_VALUE: -2
};
var SERVER_CONFIG = {
  SERVER_URL: "http://localhost:8000",
  SERVER_KEY_HEADER: "X-Suji-Server-Key",
  MATCH_TYPE_NAME: "Sudoku",
  ENDPOINTS: {
    GET_MATCH_TYPE: "/api/match_type/get_by_name/",
    CREATE_MATCH: "/api/match/create/",
    FINISH_MATCH: "/api/match/{uuid}/finish/"}
};
var STORAGE_KEYS = {
  GAME_PREFIX: "sudoku_game:",
  PLAYER_PREFIX: "sudoku_player:",
  MATCH_PREFIX: "sudoku_match:"
};
var MESSAGES = {
  CLIENT: {
    FILL: "fill",
    COMPLETE: "complete"
  },
  SERVER: {
    MATCH_STARTED: "match_started",
    PLAYER_MOVED: "player_moved",
    INVALID_MOVE: "invalid_move",
    MATCH_ENDED: "match_ended",
    ERROR: "error"
  }
};
var GAME_CONFIG = {
  WRONG_MOVE_PENALTY: 5
};

var SudokuGenerator = function () {
  function SudokuGenerator() {}
  SudokuGenerator.generate = function (difficulty) {
    if (difficulty === void 0) {
      difficulty = SUDOKU_CONFIG.DEFAULT_DIFFICULTY;
    }
    var grid = SudokuGenerator.createCompleteGrid();
    return SudokuGenerator.removeCells(grid, difficulty);
  };
  SudokuGenerator.createCompleteGrid = function () {
    var grid = new Array(SUDOKU_CONFIG.GRID_SIZE).fill(SUDOKU_CONFIG.EMPTY_CELL_VALUE);
    SudokuGenerator.fillGrid(grid);
    return grid;
  };
  SudokuGenerator.fillGrid = function (grid) {
    for (var i = 0; i < SUDOKU_CONFIG.GRID_SIZE; i++) {
      if (grid[i] === SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        var numbers = SudokuGenerator.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (var _i = 0, numbers_1 = numbers; _i < numbers_1.length; _i++) {
          var num = numbers_1[_i];
          if (SudokuGenerator.isValidPlacement(grid, i, num)) {
            grid[i] = num;
            if (SudokuGenerator.fillGrid(grid)) {
              return true;
            }
            grid[i] = SUDOKU_CONFIG.EMPTY_CELL_VALUE;
          }
        }
        return false;
      }
    }
    return true;
  };
  SudokuGenerator.isValidPlacement = function (grid, index, num) {
    var row = Math.floor(index / SUDOKU_CONFIG.BOARD_WIDTH);
    var col = index % SUDOKU_CONFIG.BOARD_WIDTH;
    for (var c = 0; c < SUDOKU_CONFIG.BOARD_WIDTH; c++) {
      if (grid[row * SUDOKU_CONFIG.BOARD_WIDTH + c] === num) return false;
    }
    for (var r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      if (grid[r * SUDOKU_CONFIG.BOARD_WIDTH + col] === num) return false;
    }
    var boxRow = Math.floor(row / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    var boxCol = Math.floor(col / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    for (var r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (var c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        if (grid[r * SUDOKU_CONFIG.BOARD_WIDTH + c] === num) return false;
      }
    }
    return true;
  };
  SudokuGenerator.removeCells = function (grid, difficulty) {
    var result = __spreadArray([], grid, true);
    var cellsToRemove = Math.floor(SUDOKU_CONFIG.GRID_SIZE * difficulty);
    var indices = Array.from({
      length: SUDOKU_CONFIG.GRID_SIZE
    }, function (_, i) {
      return i;
    });
    var shuffledIndices = SudokuGenerator.shuffleArray(indices);
    for (var i = 0; i < cellsToRemove && i < shuffledIndices.length; i++) {
      result[shuffledIndices[i]] = SUDOKU_CONFIG.EMPTY_CELL_VALUE;
    }
    return result;
  };
  SudokuGenerator.shuffleArray = function (array) {
    var _a;
    var shuffled = __spreadArray([], array, true);
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
    }
    return shuffled;
  };
  return SudokuGenerator;
}();

var SudokuValidator = function () {
  function SudokuValidator() {}
  SudokuValidator.isValidMove = function (index, initialBoard, currentBoard, moveValue) {
    if (initialBoard[index] !== SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
      return false;
    }
    if (moveValue < 1 || moveValue > 9) {
      return false;
    }
    var tempBoard = __spreadArray([], currentBoard, true);
    tempBoard[index] = moveValue;
    return SudokuValidator.isValidPlacement(tempBoard, index, moveValue);
  };
  SudokuValidator.isValidPlacement = function (board, index, value) {
    var row = Math.floor(index / SUDOKU_CONFIG.BOARD_WIDTH);
    var col = index % SUDOKU_CONFIG.BOARD_WIDTH;
    for (var c = 0; c < SUDOKU_CONFIG.BOARD_WIDTH; c++) {
      var checkIndex = row * SUDOKU_CONFIG.BOARD_WIDTH + c;
      if (checkIndex !== index && board[checkIndex] === value) {
        return false;
      }
    }
    for (var r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      var checkIndex = r * SUDOKU_CONFIG.BOARD_WIDTH + col;
      if (checkIndex !== index && board[checkIndex] === value) {
        return false;
      }
    }
    var boxRow = Math.floor(row / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    var boxCol = Math.floor(col / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    for (var r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (var c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        var checkIndex = r * SUDOKU_CONFIG.BOARD_WIDTH + c;
        if (checkIndex !== index && board[checkIndex] === value) {
          return false;
        }
      }
    }
    return true;
  };
  SudokuValidator.isGameComplete = function (board) {
    for (var i = 0; i < SUDOKU_CONFIG.GRID_SIZE; i++) {
      if (board[i] === SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        return false;
      }
    }
    return SudokuValidator.isValidSolution(board);
  };
  SudokuValidator.isValidSolution = function (board) {
    for (var i = 0; i < SUDOKU_CONFIG.BOARD_WIDTH; i++) {
      if (!SudokuValidator.isValidGroup(SudokuValidator.getRow(board, i)) || !SudokuValidator.isValidGroup(SudokuValidator.getColumn(board, i)) || !SudokuValidator.isValidGroup(SudokuValidator.getBox(board, i))) {
        return false;
      }
    }
    return true;
  };
  SudokuValidator.getRow = function (board, row) {
    return board.slice(row * SUDOKU_CONFIG.BOARD_WIDTH, (row + 1) * SUDOKU_CONFIG.BOARD_WIDTH);
  };
  SudokuValidator.getColumn = function (board, col) {
    var column = [];
    for (var r = 0; r < SUDOKU_CONFIG.BOARD_HEIGHT; r++) {
      column.push(board[r * SUDOKU_CONFIG.BOARD_WIDTH + col]);
    }
    return column;
  };
  SudokuValidator.getBox = function (board, boxIndex) {
    var box = [];
    var boxRow = Math.floor(boxIndex / SUDOKU_CONFIG.BOX_SIZE) * SUDOKU_CONFIG.BOX_SIZE;
    var boxCol = boxIndex % SUDOKU_CONFIG.BOX_SIZE * SUDOKU_CONFIG.BOX_SIZE;
    for (var r = boxRow; r < boxRow + SUDOKU_CONFIG.BOX_SIZE; r++) {
      for (var c = boxCol; c < boxCol + SUDOKU_CONFIG.BOX_SIZE; c++) {
        box.push(board[r * SUDOKU_CONFIG.BOARD_WIDTH + c]);
      }
    }
    return box;
  };
  SudokuValidator.isValidGroup = function (group) {
    var seen = new Set();
    for (var _i = 0, group_1 = group; _i < group_1.length; _i++) {
      var num = group_1[_i];
      if (num !== SUDOKU_CONFIG.EMPTY_CELL_VALUE && seen.has(num)) {
        return false;
      }
      if (num !== SUDOKU_CONFIG.EMPTY_CELL_VALUE) {
        seen.add(num);
      }
    }
    return true;
  };
  return SudokuValidator;
}();

var DjangoClient = function () {
  function DjangoClient() {
    this.serverKey = "server_key";
    this.baseUrl = SERVER_CONFIG.SERVER_URL;
  }
  DjangoClient.prototype.getHeaders = function () {
    var _a;
    return _a = {
      "Content-Type": "application/json"
    }, _a[SERVER_CONFIG.SERVER_KEY_HEADER] = this.serverKey, _a;
  };
  DjangoClient.prototype.getMatchType = function (name) {
    if (name === void 0) {
      name = SERVER_CONFIG.MATCH_TYPE_NAME;
    }
    return __awaiter(this, void 0, void 0, function () {
      var url, response, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3,, 4]);
            url = "".concat(this.baseUrl).concat(SERVER_CONFIG.ENDPOINTS.GET_MATCH_TYPE, "?name=").concat(name);
            return [4, fetch(url, {
              headers: this.getHeaders()
            })];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to get match type: ".concat(response.statusText));
            }
            return [4, response.json()];
          case 2:
            return [2, _a.sent()];
          case 3:
            error_1 = _a.sent();
            console.error("Error getting match type:", error_1);
            return [2, null];
          case 4:
            return [2];
        }
      });
    });
  };
  DjangoClient.prototype.createMatch = function (playerIds, matchTypeId, gameUuid) {
    return __awaiter(this, void 0, void 0, function () {
      var url, body, response, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3,, 4]);
            url = "".concat(this.baseUrl).concat(SERVER_CONFIG.ENDPOINTS.CREATE_MATCH);
            body = {
              players: playerIds,
              match_type: matchTypeId,
              uuid: gameUuid
            };
            return [4, fetch(url, {
              method: "POST",
              headers: this.getHeaders(),
              body: JSON.stringify(body)
            })];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to create match: ".concat(response.statusText));
            }
            return [4, response.json()];
          case 2:
            return [2, _a.sent()];
          case 3:
            error_2 = _a.sent();
            console.error("Error creating match:", error_2);
            return [2, null];
          case 4:
            return [2];
        }
      });
    });
  };
  DjangoClient.prototype.finishMatch = function (matchUuid, winner, players, endTime) {
    return __awaiter(this, void 0, void 0, function () {
      var url, playersData, body, response, result, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3,, 4]);
            url = "".concat(this.baseUrl).concat(SERVER_CONFIG.ENDPOINTS.FINISH_MATCH).replace("{uuid}", matchUuid);
            playersData = players.map(function (player) {
              return {
                id: player.player_id,
                board: player.private_board.cells,
                result: player.player_id === winner ? "win" : "lose"
              };
            });
            body = {
              players: playersData,
              winner: winner,
              end_time: endTime
            };
            return [4, fetch(url, {
              method: "POST",
              headers: this.getHeaders(),
              body: JSON.stringify(body)
            })];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to finish match: ".concat(response.statusText));
            }
            return [4, response.json()];
          case 2:
            result = _a.sent();
            return [2, result.result];
          case 3:
            error_3 = _a.sent();
            console.error("Error finishing match:", error_3);
            return [2, null];
          case 4:
            return [2];
        }
      });
    });
  };
  DjangoClient.prototype.canPlayerJoin = function (matchTypeId, playerId) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        try {
          return [2, true];
        } catch (error) {
          console.error("Error checking can join:", error);
          return [2, false];
        }
        return [2];
      });
    });
  };
  return DjangoClient;
}();

var GamePhase;
(function (GamePhase) {
  GamePhase["WAITING_FOR_PLAYERS"] = "waiting_for_players";
  GamePhase["MATCH_ACTIVE"] = "active";
  GamePhase["MATCH_ENDED"] = "ended";
})(GamePhase || (GamePhase = {}));
var GameResult;
(function (GameResult) {
  GameResult["WIN"] = "win";
  GameResult["LOSE"] = "lose";
  GameResult["DRAW"] = "draw";
})(GameResult || (GameResult = {}));

var ClientOpCodes;
(function (ClientOpCodes) {
  ClientOpCodes[ClientOpCodes["FILL"] = 1] = "FILL";
  ClientOpCodes[ClientOpCodes["COMPLETE"] = 2] = "COMPLETE";
  ClientOpCodes[ClientOpCodes["MATCH_STATE"] = 3] = "MATCH_STATE";
})(ClientOpCodes || (ClientOpCodes = {}));
var ServerOpCodes;
(function (ServerOpCodes) {
  ServerOpCodes[ServerOpCodes["MATCH_STARTED"] = 100] = "MATCH_STARTED";
  ServerOpCodes[ServerOpCodes["MOVE_MADE"] = 101] = "MOVE_MADE";
  ServerOpCodes[ServerOpCodes["MATCH_ENDED"] = 102] = "MATCH_ENDED";
  ServerOpCodes[ServerOpCodes["STATE_ACK"] = 103] = "STATE_ACK";
  ServerOpCodes[ServerOpCodes["ERROR"] = 500] = "ERROR";
  ServerOpCodes[ServerOpCodes["INVALID_MOVE"] = 501] = "INVALID_MOVE";
})(ServerOpCodes || (ServerOpCodes = {}));

var StorageUtils = function () {
  function StorageUtils() {}
  StorageUtils.getGameKey = function (gameId) {
    return "".concat(STORAGE_KEYS.GAME_PREFIX).concat(gameId);
  };
  StorageUtils.getPlayerKey = function (gameId, sessionId) {
    return "".concat(STORAGE_KEYS.PLAYER_PREFIX).concat(gameId, ":").concat(sessionId);
  };
  StorageUtils.getMatchKey = function (matchUuid) {
    return "".concat(STORAGE_KEYS.MATCH_PREFIX).concat(matchUuid);
  };
  StorageUtils.writeGameState = function (nk, gameId, gameState, userId) {
    nk.storageWrite([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      value: gameState,
      userId: userId
    }]);
  };
  StorageUtils.readGameState = function (nk, gameId, userId) {
    var data = nk.storageRead([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      userId: userId
    }]);
    return data.length > 0 ? data[0].value : null;
  };
  StorageUtils.deleteGameState = function (nk, gameId, userId) {
    nk.storageDelete([{
      collection: "sudoku_games",
      key: StorageUtils.getGameKey(gameId),
      userId: userId
    }]);
  };
  return StorageUtils;
}();

function matchInit(ctx, logger, nk, params) {
  logger.info("Initializing Sudoku match");
  var difficulty = parseFloat(params.difficulty) || SUDOKU_CONFIG.DEFAULT_DIFFICULTY;
  var initialBoard = SudokuGenerator.generate(difficulty);
  var state = {
    match_id: ctx.matchId || "",
    initial_board: {
      cells: initialBoard
    },
    players: {},
    phase: GamePhase.WAITING_FOR_PLAYERS,
    created_at: Date.now()
  };
  StorageUtils.writeGameState(nk, ctx.matchId, state, ctx.userId);
  return {
    state: state,
    tickRate: 10,
    label: "sudoko"
  };
}
function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  logger.info("Player ".concat(presence.userId, " attempting to join match"));
  var matchState = state;
  var playerCount = Object.keys(matchState.players).length;
  if (playerCount >= SUDOKU_CONFIG.DEFAULT_MAX_PLAYERS) {
    return {
      state: state,
      accept: false,
      rejectMessage: "Match is full"
    };
  }
  if (matchState.players[presence.userId]) {
    return {
      state: state,
      accept: false,
      rejectMessage: "Already in match"
    };
  }
  return {
    state: state,
    accept: true
  };
}
function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  logger.info("Players joined match: ".concat(presences.map(function (p) {
    return p.userId;
  }).join(", ")));
  var matchState = state;
  presences.forEach(function (presence) {
    if (!matchState.players[presence.userId]) {
      var playerState = {
        user_id: presence.userId,
        profile_name: presence.username || "Player_".concat(presence.userId.slice(-4)),
        avatar: "",
        private_board: {
          cells: __spreadArray([], matchState.initial_board.cells, true)
        },
        public_board: {
          cells: __spreadArray([], matchState.initial_board.cells, true)
        },
        move_count: 0,
        start_time: Date.now(),
        wrong_move_cnt: 0,
        move_banned: null
      };
      matchState.players[presence.userId] = playerState;
    }
  });
  var playerCount = Object.keys(matchState.players).length;
  if (playerCount >= SUDOKU_CONFIG.DEFAULT_MAX_PLAYERS && matchState.phase === GamePhase.WAITING_FOR_PLAYERS) {
    logger.debug("WE ARE HERE");
    matchState.phase = GamePhase.MATCH_ACTIVE;
    startMatch(ctx, logger, nk, dispatcher, matchState);
  }
  return {
    state: matchState
  };
}
function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  logger.info("Players left match: ".concat(presences.map(function (p) {
    return p.userId;
  }).join(", ")));
  var matchState = state;
  if (matchState.phase === GamePhase.MATCH_ACTIVE) {
    presences.forEach(function (presence) {
      if (matchState.players[presence.userId]) {
        logger.info("Player ".concat(presence.userId, " forfeited by leaving"));
      }
    });
  }
  presences.forEach(function (presence) {
    delete matchState.players[presence.userId];
  });
  if (Object.keys(matchState.players).length === 0) {
    return null;
  }
  return {
    state: matchState
  };
}
function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  var matchState = state;
  messages.forEach(function (message) {
    switch (message.opCode) {
      case ClientOpCodes.FILL:
        handleFillMessage(ctx, logger, nk, dispatcher, matchState, message);
        break;
      case ClientOpCodes.COMPLETE:
        handleCompleteMessage(ctx, logger, nk, dispatcher, matchState, message);
        break;
      case ClientOpCodes.MATCH_STATE:
        handleRequestState(ctx, logger, nk, dispatcher, matchState, message);
      default:
        logger.warn("Unknown message opCode: ".concat(message.opCode));
        break;
    }
  });
  return {
    state: matchState
  };
}
function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info("Match terminating");
  var matchState = state;
  if (matchState.match_uuid) {
    finishDjangoMatch(ctx, logger, nk, matchState);
  }
  return null;
}
function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
  logger.info("Match signal received");
  var matchState = state;
  try {
    var signalData = JSON.parse(data);
    switch (signalData.type) {
      case "pause_match":
        logger.info("Match pause signal received");
        break;
      case "resume_match":
        logger.info("Match resume signal received");
        break;
      default:
        logger.warn("Unknown signal type: ".concat(signalData.type));
    }
  } catch (error) {
    logger.error("Error handling match signal:", error);
  }
  return {
    state: matchState
  };
}
function matchmakerMatched(ctx, logger, nk, entries) {
  logger.info("🎯 MATCHMAKER MATCHED! Creating Sudoku match...");
  logger.info("👥 Matched " + entries.length + " players");
  for (var i = 0; i < entries.length; i++) {
    logger.info("   Player " + (i + 1) + ": " + entries[i].presence.username);
  }
  try {
    var initial_board = SudokuGenerator.generate(0.5);
    var matchId = nk.matchCreate("sudoku", {
      initial_board: initial_board
    });
    logger.info("INITIAL_BOARD: " + initial_board.toString());
    logger.info("✅ Created Sudoku match for matchmaker: " + matchId);
    return matchId;
  } catch (error) {
    logger.error("❌ Error in matchmaker matched: " + error);
    return "";
  }
}
function startMatch(ctx, logger, nk, dispatcher, matchState) {
  return __awaiter(this, void 0, void 0, function () {
    var initialBoardCells, body, url, token, res, startTime, message;
    return __generator(this, function (_a) {
      logger.info("Starting Sudoku match");
      try {
        initialBoardCells = matchState.initial_board.cells;
        if (!Array.isArray(initialBoardCells) || initialBoardCells.length === 0) {
          logger.error("Invalid initial board data:", initialBoardCells);
          return [2];
        }
        body = {
          event: "game_started",
          event_id: nk.uuidv4(),
          match_id: ctx.matchId,
          region: "global",
          players: [],
          initial_board_hash: nk.sha256Hash(initialBoardCells.join(',')),
          ts: Date.now()
        };
        url = ctx.env["PUBLISHER_URL"];
        token = ctx.env["PUBLISHER_AUTH_TOKEN"];
        logger.debug("[MATCHJOIN.STARTMATCH] URL: ".concat(url));
        logger.debug("[MATCHJOIN.STARTMATCH] TOKEN: ".concat(token));
        res = nk.httpRequest(url + "/v1/events/game-started", 'post', {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-Idempotency-Key": body.event_id
        }, JSON.stringify(body), 5000);
        logger.debug("[MATCHJOIN.STARTMATCH] Response: ".concat(JSON.stringify(res)));
        logger.debug("[MATCHJOIN.STARTMATCH] ".concat(res));
      } catch (error) {
        logger.error("Error creating Django match:", error.message || error);
        logger.error("Error creating Django match:", error.stack);
      }
      startTime = new Date().getTime();
      Object.values(matchState.players).forEach(function (player) {
        player.start_time = startTime;
      });
      message = {
        type: MESSAGES.SERVER.MATCH_STARTED,
        initial_board: matchState.initial_board.cells,
        players: Object.keys(matchState.players).length
      };
      dispatcher.broadcastMessage(ServerOpCodes.MATCH_STARTED, JSON.stringify(message));
      return [2];
    });
  });
}
function handleFillMessage(ctx, logger, nk, dispatcher, matchState, message) {
  if (matchState.phase !== GamePhase.MATCH_ACTIVE) {
    var errorMsg = {
      type: MESSAGES.SERVER.ERROR,
      message: "Game is not active"
    };
    dispatcher.broadcastMessage(ServerOpCodes.ERROR, JSON.stringify(errorMsg), [message.sender]);
    return;
  }
  var datetime = new Date().getTime();
  var player = matchState.players[message.sender.userId];
  if (!player) {
    return;
  }
  if (player.move_banned) {
    logger.debug("HERE IS THE Othershit: " + Object.keys(player.move_banned).join(', '));
    logger.debug("HERE IS THE Banned: " + player.move_banned);
    var banned_until = player.move_banned;
    logger.debug("HERE IS THE BANNED UNTIL: " + banned_until);
    if (banned_until > datetime) {
      var invalidMsg = {
        type: MESSAGES.SERVER.INVALID_MOVE,
        error: "You are banned for ".concat(banned_until - datetime),
        banned_until: player.move_banned
      };
      dispatcher.broadcastMessage(ServerOpCodes.INVALID_MOVE, JSON.stringify(invalidMsg), [message.sender]);
      return;
    }
  }
  try {
    logger.debug("RECIED DATA in HANDLE FILL : ".concat(message.data));
    var str_data = nk.binaryToString(message.data);
    var data = JSON.parse(str_data);
    logger.debug("RECIED DATA: ".concat(JSON.stringify(data)));
    if (typeof data.index === "undefined" || typeof data.num === "undefined") {
      logger.error("Invalid message format: missing 'index' or 'num'");
      return;
    }
    var index = data.index,
      num = data.num;
    logger.debug("RECIEVED DATA index: ".concat(index, ", num: ").concat(num));
    var isValid = SudokuValidator.isValidMove(index, matchState.initial_board.cells, player.private_board.cells, num);
    logger.debug("After is valid Move, ".concat(isValid));
    if (isValid) {
      logger.debug("In is_valid condition");
      player.private_board.cells[index] = num;
      player.public_board.cells[index] = SUDOKU_CONFIG.MASK_CELL_VALUE;
      player.move_count += 1;
      logger.debug("After player.move_count += 1");
      var moveMsg = {
        type: MESSAGES.SERVER.PLAYER_MOVED,
        player: message.sender.userId,
        index: index
      };
      dispatcher.broadcastMessage(ServerOpCodes.MOVE_MADE, JSON.stringify(moveMsg));
    } else {
      logger.debug("In not is_valid condition");
      var now = new Date().getTime();
      var banned_time = GAME_CONFIG.WRONG_MOVE_PENALTY * (player.wrong_move_cnt || 1);
      player.wrong_move_cnt += 1;
      player.move_banned = now + banned_time * 1000;
      var invalidMsg = {
        type: MESSAGES.SERVER.INVALID_MOVE,
        error: "Move at index ".concat(index, " is not valid"),
        banned_until: player.move_banned
      };
      dispatcher.broadcastMessage(ServerOpCodes.INVALID_MOVE, JSON.stringify(invalidMsg), [message.sender]);
      logger.debug("Done");
    }
  } catch (error) {
    logger.error("Error handling fill message:", error);
  }
}
function handleCompleteMessage(ctx, logger, nk, dispatcher, matchState, message) {
  var player = matchState.players[message.sender.userId];
  if (!player) return;
  try {
    var data = JSON.parse(nk.binaryToString(message.data));
    var solution = data.solution;
    if (SudokuValidator.isValidSolution(solution)) {
      player.private_board.cells = solution;
      player.completion_time = Date.now();
      handleGameCompletion(ctx, logger, nk, dispatcher, matchState, message.sender.userId);
    }
  } catch (error) {
    logger.error("Error handling complete message:", error);
  }
}
function handleGameCompletion(ctx, logger, nk, dispatcher, matchState, winnerId) {
  logger.info("Game completed by player: ".concat(winnerId));
  matchState.winner_id = winnerId;
  matchState.phase = GamePhase.MATCH_ENDED;
  matchState.players[winnerId].completion_time = Date.now();
  var endMsg = {
    type: MESSAGES.SERVER.MATCH_ENDED,
    winner: winnerId,
    completion_time: matchState.players[winnerId].completion_time
  };
  dispatcher.broadcastMessage(ServerOpCodes.MATCH_ENDED, JSON.stringify(endMsg));
  finishDjangoMatch(ctx, logger, nk, matchState);
}
function finishDjangoMatch(ctx, logger, nk, matchState) {
  return __awaiter(this, void 0, void 0, function () {
    var djangoClient, winner, endTime, result, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!matchState.match_uuid || !matchState.winner_id) {
            return [2];
          }
          _a.label = 1;
        case 1:
          _a.trys.push([1, 3,, 4]);
          djangoClient = new DjangoClient();
          winner = matchState.players[matchState.winner_id];
          endTime = Date.now();
          return [4, djangoClient.finishMatch(matchState.match_uuid, winner.player_id || 0, Object.values(matchState.players), endTime)];
        case 2:
          result = _a.sent();
          if (result) {
            logger.info("Django match finished successfully: ".concat(result.id));
          }
          return [3, 4];
        case 3:
          error_1 = _a.sent();
          logger.error("Error finishing Django match:", error_1);
          return [3, 4];
        case 4:
          return [2];
      }
    });
  });
}
function handleRequestState(ctx, logger, nk, dispatcher, matchState, message) {
  logger.info("Requested Match state from ".concat(message.sender.persistence));
  var m_state = {
    match_id: matchState.match_id,
    initial_board: {
      cells: JSON.parse(JSON.stringify(matchState.initial_board.cells))
    },
    players: {},
    phase: matchState.phase,
    match_uuid: matchState.match_uuid
  };
  for (var _i = 0, _a = Object.entries(matchState.players); _i < _a.length; _i++) {
    var _b = _a[_i],
      key = _b[0],
      value = _b[1];
    if (key == message.sender.userId) {
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
        public_board: JSON.parse(JSON.stringify(value.public_board))
      };
    } else {
      m_state.players[key] = {
        user_id: value.user_id,
        profile_name: value.profile_name,
        move_count: value.move_count,
        start_time: value.start_time,
        completion_time: value.completion_time,
        player_id: value.player_id,
        move_banned: value.move_banned,
        wrong_move_cnt: value.wrong_move_cnt,
        public_board: JSON.parse(JSON.stringify(value.public_board))
      };
    }
  }
  dispatcher.broadcastMessage(ServerOpCodes.STATE_ACK, JSON.stringify(m_state), [message.sender]);
}

function rpcHealthcheck(ctx, logger, nk, payload) {
  logger.info("Healthcheck RPC called");
  return JSON.stringify({
    success: true
  });
}
var InitModule = function InitModule(ctx, logger, nk, initializer) {
  initializer.registerRpc("healthcheck", rpcHealthcheck);
  initializer.registerMatch("sudoku", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);
  logger.info("Nakama Sudoku match handler registered successfully.");
};
!InitModule && InitModule.bind(null);
