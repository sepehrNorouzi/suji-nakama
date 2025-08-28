import json
import time
import asyncio
import aio_pika
from aio_pika import ExchangeType, DeliveryMode, Message
# from aio_pika.exceptions import UnroutableError
from app.config import settings
from app.metrics import amqp_confirm_latency, amqp_published, amqp_publish_failures, amqp_unroutable


class Rabbit:
    def __init__(self) -> None:
        self.conn: aio_pika.RobustConnection | None = None
        self.channel: aio_pika.RobustChannel | None = None
        self.exchange: aio_pika.Exchange | None = None

    async def connect(self) -> None:
        self.conn = await aio_pika.connect_robust(settings.RABBIT_URL)
        self.channel = await self.conn.channel(publisher_confirms=True)
        self.exchange = await self.channel.declare_exchange(
            settings.EXCHANGE, ExchangeType.TOPIC, durable=True
        )

    @property
    def is_ready(self) -> bool:
        return bool(self.conn and not self.conn.is_closed and self.exchange)

    async def publish(self, routing_key: str, payload: dict, message_id: str | None) -> None:
        if not self.exchange:
            raise RuntimeError("Exchange not ready")
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        msg = Message(
            body=body,
            content_type="application/json",
            delivery_mode=DeliveryMode.PERSISTENT,
            message_id=message_id,
            timestamp=int(time.time()),
        )
        start = time.perf_counter()
        try:
            # mandatory=True -> if no queues match, UnroutableError is raised
            await self.exchange.publish(msg, routing_key=routing_key, mandatory=True)
            amqp_published.labels(routing_key=routing_key).inc()
        # except UnroutableError as e:
            # Count and drop (or you could requeue to a DLX via HTTP)
            # amqp_unroutable.inc()
            # raise e
        except Exception:
            amqp_publish_failures.inc()
            raise
        finally:
            amqp_confirm_latency.observe(time.perf_counter() - start)

    async def close(self) -> None:
        try:
            if self.channel and not self.channel.is_closed:
                await self.channel.close()
        finally:
            if self.conn and not self.conn.is_closed:
                await self.conn.close()
