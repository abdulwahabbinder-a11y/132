"""AWS Lambda entrypoint for the FastAPI application (API Gateway HTTP API)."""

from mangum import Mangum

from app.main import app

handler = Mangum(app, lifespan="auto")
