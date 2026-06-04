from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    nickname: str
    points_balance: int
    locale: str

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    nickname: str | None = None
    locale: str | None = None