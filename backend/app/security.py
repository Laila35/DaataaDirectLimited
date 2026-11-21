import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import SessionToken, User
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"
def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split("$", 1)
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return secrets.compare_digest(check, digest)
def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
def drop_sessions(db: Session, user_id: int) -> None:
    db.query(SessionToken).filter(SessionToken.user_id == user_id).delete()
def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(SessionToken(token=token, user_id=user.id, expires_at=datetime.utcnow() + timedelta(days=7)))
    db.commit()
    return token
def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in required")
    token = authorization.split(" ", 1)[1].strip()
    row = db.query(SessionToken).filter(SessionToken.token == token).first()
    if row is None or row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired")
    return row.user
def optional_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    row = db.query(SessionToken).filter(SessionToken.token == token).first()
    if row is None or row.expires_at < datetime.utcnow():
        return None
    return row.user
def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
def require_staff(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"employee", "admin"}:
        raise HTTPException(status_code=403, detail="Staff access required")
    return user
