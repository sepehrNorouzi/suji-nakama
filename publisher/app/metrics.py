from prometheus_client import Counter, Gauge, Histogram, CollectorRegistry, CONTENT_TYPE_LATEST, generate_latest

registry = CollectorRegistry()

http_requests = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["route", "method", "code"],
    registry=registry,
)

inbuf_size = Gauge(
    "publisher_inbuf_size",
    "In-memory buffer size",
    registry=registry,
)

amqp_published = Counter(
    "amqp_published_total",
    "Messages published to broker",
    ["routing_key"],
    registry=registry,
)

amqp_publish_failures = Counter(
    "amqp_publish_failures_total",
    "Publish failures",
    registry=registry,
)

amqp_unroutable = Counter(
    "amqp_unroutable_total",
    "Messages returned as unroutable",
    registry=registry,
)

amqp_confirm_latency = Histogram(
    "amqp_confirm_latency_seconds",
    "Publisher confirm latency",
    buckets=(0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1.0),
    registry=registry,
)

def metrics_response():
    return CONTENT_TYPE_LATEST, generate_latest(registry)
