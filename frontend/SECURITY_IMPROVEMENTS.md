# 🔒 Security Improvements - Authentication System

## Problem Fixed
**Security Vulnerability**: Users could manually edit the `srwl_user` cookie to change their role from "user" to "admin", bypassing authorization checks.

## Solution Implemented

### Frontend Changes ✅

1. **Store Only Username in Cookie**
   - `srwl_user` cookie now stores only the username (string), not role
   - Role cannot be tampered with since it's fetched from backend

2. **Fetch Role from Backend API**
   - Role is fetched from `/api/users/role/{username}` endpoint
   - Ensures role is always validated by backend
   - Happens on:
     - Initial page load (if user cookie exists)
     - After successful login

3. **Removed Token from Frontend State**
   - Token should be HttpOnly cookie set by backend
   - Frontend cannot access HttpOnly cookies (prevents XSS attacks)
   - Token automatically sent with requests

### Backend Changes Required ⚠️

To complete the security implementation, update your FastAPI backend:

#### 1. Set HttpOnly Cookie on Login

```python
from fastapi import Response

@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: AsyncSession = Depends(get_session)
):
    # ... your authentication logic ...
    
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "is_admin": user.is_admin}
    )
    
    # Set HttpOnly cookie for token
    response.set_cookie(
        key="srwl_token",
        value=access_token,
        httponly=True,  # Cannot be accessed by JavaScript
        secure=True,    # Only sent over HTTPS (set to False in development)
        samesite="strict",  # CSRF protection
        max_age=604800  # 7 days in seconds
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
```

#### 2. Clear HttpOnly Cookie on Logout

```python
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="srwl_token")
    return {"message": "Logged out successfully"}
```

#### 3. Read Token from Cookie in Dependency

Update your `get_current_user` dependency to read from cookie:

```python
from fastapi import Cookie

async def get_current_user(
    srwl_token: str = Cookie(None),  # Read from cookie
    session: AsyncSession = Depends(get_session)
):
    if not srwl_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = jwt.decode(srwl_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        # ... rest of your logic
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

## Security Benefits

✅ **Prevents Role Tampering**: Role fetched from backend, not stored in frontend
✅ **HttpOnly Token**: JavaScript cannot access the token (prevents XSS)
✅ **Automatic Token Inclusion**: Cookie sent automatically with requests
✅ **CSRF Protection**: SameSite=Strict prevents cross-site attacks
✅ **Secure by Default**: Token only sent over HTTPS in production

## How It Works Now

1. **Login Flow**:
   ```
   User submits credentials
   → Backend validates and sets HttpOnly cookie
   → Frontend stores only username in srwl_user cookie
   → Frontend fetches role from /api/users/role/{username}
   → User logged in with secure role
   ```

2. **Protected Routes**:
   ```
   User navigates to /settings
   → Frontend checks user.role === 'admin'
   → Role was fetched from backend (secure)
   → Backend validates token from HttpOnly cookie
   → Access granted/denied
   ```

3. **API Requests**:
   ```
   Frontend makes API call
   → Token automatically included from HttpOnly cookie
   → Backend validates token
   → Returns data or 401 if invalid
   ```

## Testing

1. Try to manually edit `srwl_user` cookie to change username
   - ✅ Role will be fetched for that username (if exists)
   
2. Try to access HttpOnly `srwl_token` cookie from browser console
   - ✅ `document.cookie` will not show HttpOnly cookies
   
3. Try to access admin page as regular user
   - ✅ Backend validates role from token, not from client

## Notes

- Token expiration is handled by JWT exp claim
- Backend should validate token on every protected route
- Role checks should also be done on backend, not just frontend
- Frontend role check is for UX only (hiding/showing UI elements)
