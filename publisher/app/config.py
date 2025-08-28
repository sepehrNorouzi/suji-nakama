from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8080
    RABBIT_URL: str  # amqp://user:pass@rabbitmq:5672/%2Fgame?heartbeat=10
    EXCHANGE: str = "game.events"
    AUTH_TOKEN: str | None = None
    INBUF_CAPACITY: int = 10_000
    READINESS_MAX_BACKLOG: int = 8_000
    ROUTING_PREFIX: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
