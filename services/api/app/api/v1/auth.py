from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from services.api.app.core.database import get_db
from services.api.app.core.security import verify_password, create_access_token
from services.api.app.core.config import settings
from services.api.app.models.models import User
from services.api.app.schemas.schemas import LoginRequest, TokenResponse, UserOut, RefreshRequest, StandardResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=StandardResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_access_token(subject=user.id, role=user.role)

    user_out = UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        designation=user.designation,
        department=user.department,
        hospital_id=user.facility_id or "hosp_01J"
    )

    return StandardResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=86400,
            user=user_out
        ).dict()
    )

@router.post("/refresh", response_model=StandardResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_token = create_access_token(subject=user_id, role=role)
    return StandardResponse(
        success=True,
        data={"access_token": new_token, "token_type": "Bearer", "expires_in": 86400}
    )

@router.post("/logout", response_model=StandardResponse)
def logout():
    return StandardResponse(success=True, data={"message": "Logged out successfully"})

@router.get("/me", response_model=StandardResponse)
def get_current_user_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return StandardResponse(
        success=True,
        data={
            "id": user.id,
            "username": user.username,
            "name": f"{user.first_name} {user.last_name or ''}".strip(),
            "role": user.role,
            "department": user.department
        }
    )
