from fastapi import APIRouter, Depends
from app.core.security import verify_jwt

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/me")
def get_identity(user=Depends(verify_jwt)):
    return {
        "user_id": user.get("sub"),
        "email": user.get("email")
    }
