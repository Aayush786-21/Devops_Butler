import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from database import engine
from login import User
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing - lazy initialization to avoid bcrypt issues
pwd_context = None

def get_pwd_context():
    global pwd_context
    if pwd_context is None:
        try:
            # Initialize bcrypt context
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        except Exception as e:
            # If initialization fails, log and re-raise
            import logging
            logging.error(f"Failed to initialize bcrypt context: {str(e)}")
            raise
    return pwd_context

def _hash_with_bcrypt_direct(password_bytes: bytes) -> str:
    """Fallback: Hash password directly with bcrypt library"""
    import bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def _verify_with_bcrypt_direct(password_bytes: bytes, hashed: str) -> bool:
    """Fallback: Verify password directly with bcrypt library"""
    import bcrypt
    try:
        return bcrypt.checkpw(password_bytes, hashed.encode('utf-8'))
    except Exception:
        return False

# JWT token security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # Truncate password to 72 bytes
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Try using passlib first
    try:
        password_str = password_bytes.decode('utf-8', errors='ignore')
        return get_pwd_context().verify(password_str, hashed_password)
    except Exception as e:
        # If passlib fails, fall back to direct bcrypt
        error_msg = str(e)
        if "password cannot be longer than 72 bytes" in error_msg or "bcrypt" in error_msg.lower():
            import logging
            logging.warning(f"Passlib verification failed, using direct bcrypt: {error_msg[:100]}")
            return _verify_with_bcrypt_direct(password_bytes, hashed_password)
        # Log other errors but return False (don't expose to user)
        import logging
        logging.error(f"Password verification error: {error_msg}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password."""
    # Truncate password to 72 bytes BEFORE any bcrypt operations
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Try using passlib first
    try:
        password_str = password_bytes.decode('utf-8', errors='ignore')
        context = get_pwd_context()
        return context.hash(password_str)
    except (ValueError, Exception) as e:
        # If passlib fails (often due to bug detection during initialization),
        # fall back to direct bcrypt usage
        error_msg = str(e)
        if "password cannot be longer than 72 bytes" in error_msg or "bcrypt" in error_msg.lower():
            import logging
            logging.warning(f"Passlib bcrypt failed, using direct bcrypt: {error_msg[:100]}")
            return _hash_with_bcrypt_direct(password_bytes)
        # For other errors, log and re-raise
        import logging
        logging.error(f"Password hashing error: {error_msg}")
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get the current authenticated user from the JWT token."""
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    try:
        with Session(engine) as session:
            statement = select(User).where(User.username == username)
            user = session.exec(statement).first()
            if not user:
                return None
            if not verify_password(password, user.hashed_password):
                return None
            return user
    except Exception as e:
        # Log the error but don't expose it
        import logging
        logging.error(f"Authentication error for user {username}: {str(e)}")
        return None

def create_user(username: str, email: str, password: str) -> Optional[User]:
    """Create a new user."""
    with Session(engine) as session:
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.username == username)).first()
        if existing_user:
            return None
        
        existing_email = session.exec(select(User).where(User.email == email)).first()
        if existing_email:
            return None
        
        # Create new user
        hashed_password = get_password_hash(password)
        user = User(username=username, email=email, hashed_password=hashed_password)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user 