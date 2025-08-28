import asyncio
from typing import Any, Dict, TypedDict, Optional

from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from app.config import settings
from app.metrics import http_requests, inbuf_size, metrics_response
from app.schemas import BaseEvent, GameStarted, finalize_event
from app.rabbit import Rabbit

class Job(TypedDict):
    routing_key: str
    payload: Dict[str, Any]
    message_id: Optional[str]

app = FastAPI()
rabbit = Rabbit()
buffer: asyncio.Queue[Job] = asyncio.Queue(maxsize=settings.INBUF_CAPACITY)
publisher_task: asyncio.Task | None = None


def require_auth(req: Request):
    if not settings.AUTH_TOKEN:
        return
    auth = req.headers.get("authorization", "")
    if auth != f"Bearer {settings.AUTH_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.middleware("http")
async def metrics_mw(request: Request, call_next):
    try:
        resp: Response = await call_next(request)
        route = request.url.path
        http_requests.labels(route=route, method=request.method, code=str(resp.status_code)).inc()
        return resp
    except HTTPException as he:
        http_requests.labels(route=request.url.path, method=request.method, code=str(he.status_code)).inc()
        raise
    except Exception:
        http_requests.labels(route=request.url.path, method=request.method, code="500").inc()
        raise


# --------- Background publisher ---------
async def publisher_loop():
    while True:
        job = await buffer.get()
        inbuf_size.set(buffer.qsize())
        try:
            await rabbit.publish(job["routing_key"], job["payload"], job["message_id"])
        except Exception:
            await asyncio.sleep(0.05)
            try:
                buffer.put_nowait(job)
            except asyncio.QueueFull:
                pass
        finally:
            inbuf_size.set(buffer.qsize())


# --------- Lifecycle ---------
@app.on_event("startup")
async def on_startup():
    await rabbit.connect()
    global publisher_task
    publisher_task = asyncio.create_task(publisher_loop())


@app.on_event("shutdown")
async def on_shutdown():
    if publisher_task:
        publisher_task.cancel()
        with contextlib.suppress(Exception):
            await publisher_task
    await rabbit.close()


# --------- Health & metrics ---------
@app.get("/live", response_class=PlainTextResponse)
async def live():
    return "ok"

@app.get("/ready")
async def ready():
    healthy = rabbit.is_ready and buffer.qsize() < settings.READINESS_MAX_BACKLOG
    code = 200 if healthy else 503
    return Response(content=f'{{"healthy": {str(healthy).lower()}, "backlog": {buffer.qsize()}}}', media_type="application/json", status_code=code)

@app.get("/metrics")
async def metrics():
    content_type, data = metrics_response()
    return Response(content=data, media_type=content_type)


@app.post("/v1/events")
async def post_event(event: BaseEvent, _: Any = Depends(require_auth)):
    e = finalize_event(event)
    routing_key = f"{settings.ROUTING_PREFIX}{e.event}.{e.region or 'global'}"
    job: Job = {"routing_key": routing_key, "payload": e.model_dump(mode="json"), "message_id": str(e.event_id)}
    try:
        buffer.put_nowait(job)
    except asyncio.QueueFull:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="backlog_full")
    inbuf_size.set(buffer.qsize())
    return {"status": "queued", "event_id": str(e.event_id), "routing_key": routing_key}

@app.post("/v1/events/game-started")
async def post_game_started(event: GameStarted, _: Any = Depends(require_auth)):
    e = finalize_event(event)
    routing_key = f"{settings.ROUTING_PREFIX}game_started.{e.region or 'global'}"
    job: Job = {"routing_key": routing_key, "payload": e.model_dump(mode="json"), "message_id": str(e.event_id)}
    try:
        buffer.put_nowait(job)
    except asyncio.QueueFull:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="backlog_full")
    inbuf_size.set(buffer.qsize())
    return {"status": "queued", "event_id": str(e.event_id), "routing_key": routing_key}
