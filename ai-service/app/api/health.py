from fastapi import APIRouter

from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Simple liveness probe used by the Spring Boot backend / load balancer / uptime monitors.",
)
async def health_check() -> HealthResponse:
    return HealthResponse(status="running")
