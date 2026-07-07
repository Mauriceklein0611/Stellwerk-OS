"""Request-ID-Middleware: erzeugt/übernimmt ``X-Request-Id`` und loggt Requests."""

from __future__ import annotations

import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-Id"


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Bindet je Request eine ``request_id`` an den Log-Kontext.

    Ist der Header ``X-Request-Id`` gesetzt, wird er durchgereicht, sonst eine
    UUID erzeugt. Der Wert landet im Log-Kontext und im Response-Header.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        log = structlog.get_logger()
        log.info("request.start", method=request.method, path=request.url.path)

        response = await call_next(request)

        response.headers[REQUEST_ID_HEADER] = request_id
        log.info("request.end", status_code=response.status_code)
        structlog.contextvars.clear_contextvars()
        return response
