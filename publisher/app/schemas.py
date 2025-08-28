from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4


class BaseEvent(BaseModel):
    event: str = Field(..., min_length=1)
    event_id: Optional[UUID] = None
    region: str = "global"
    ts: Optional[datetime] = None


class Player(BaseModel):
    id: str
    username: Optional[str] = None


class GameStarted(BaseEvent):
    event: str = "game_started"
    match_id: str
    players: List[Player] = []
    initial_board_hash: Optional[str] = None


def finalize_event(e: BaseEvent) -> BaseEvent:
    if e.event_id is None:
        e.event_id = uuid4()
    if e.ts is None:
        e.ts = datetime.utcnow()
    return e
