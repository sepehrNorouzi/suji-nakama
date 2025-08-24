export enum ClientOpCodes {
    FILL=1,
    COMPLETE=2,
    MATCH_STATE=3,
}

export enum ServerOpCodes {
    MATCH_STARTED=100,
    MOVE_MADE=101,
    MATCH_ENDED=102,
    STATE_ACK=103,
    ERROR=500,
    INVALID_MOVE=501
}
