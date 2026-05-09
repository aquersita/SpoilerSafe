"""Firebase Cloud Functions entry point — wraps the FastAPI ASGI app."""
import asyncio

from firebase_functions import https_fn, options

from main_firebase import app  # FastAPI ASGI app


@https_fn.on_request(
    region="us-central1",
    memory=options.MemoryOption.MB_512,
    timeout_sec=120,
)
def api(req: https_fn.Request) -> https_fn.Response:
    path = req.path or "/"
    qs = req.query_string
    if isinstance(qs, str):
        qs = qs.encode()
    elif qs is None:
        qs = b""

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": req.method.upper(),
        "headers": [(k.lower().encode(), v.encode()) for k, v in req.headers.items()],
        "path": path,
        "query_string": qs,
        "root_path": "",
        "scheme": "https",
        "server": ("localhost", 443),
    }

    body_bytes = req.data or b""
    if isinstance(body_bytes, str):
        body_bytes = body_bytes.encode()

    async def receive():
        return {"type": "http.request", "body": body_bytes, "more_body": False}

    started: dict = {}
    chunks: list[bytes] = []

    async def send_fn(msg):
        if msg["type"] == "http.response.start":
            started["status"] = msg["status"]
            started["headers"] = msg.get("headers", [])
        elif msg["type"] == "http.response.body":
            chunks.append(msg.get("body", b""))

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(app(scope, receive, send_fn))
    finally:
        loop.close()

    headers = {k.decode(): v.decode() for k, v in started.get("headers", [])}
    return https_fn.Response(
        response=b"".join(chunks),
        status=started.get("status", 500),
        headers=headers,
        mimetype=headers.get("content-type", "application/json"),
    )
