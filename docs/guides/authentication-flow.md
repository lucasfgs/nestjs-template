# Authentication Flow Documentation

This page describes the end-to-end JWT authentication and refresh flow implemented across a NestJS backend and Next.js frontend, including WebSocket cookie parsing. Use this as a Compodoc page (`authentication-flow.md`) under your `docs` directory.

---

## 1. Overview

- **Access Tokens**: Short-lived JWTs stored in an HTTP-only cookie (`accessToken`, SameSite=Lax, maxAge \~45s). Used to authenticate API and WebSocket requests.
- **Refresh Tokens**: Long-lived JWTs stored in an HTTP-only cookie (`refreshToken`, SameSite=Strict, maxAge \~30d). Rotated on each use and stored in a whitelist in the database.
- **Rotation & Whitelist**: On each `/auth/refresh` call, the old refresh token is validated against a DB whitelist, deleted, and a new token is issued and stored.
- **Client Handling**: Browser Axios instance queues concurrent 401-failed requests, performs a single silent `/auth/refresh`, then retries queued requests. On refresh failure, immediate redirect to `/login`.
- **Server-side SSR**: Next.js middleware verifies `accessToken` cookie and transparently calls `/auth/refresh` once per request if needed, before rendering pages.
- **WebSocket Auth**: A custom `IoAdapter` runs `cookie-parser` on each handshake, and middleware reads `socket.request.cookies.accessToken` to authenticate the connection.

---

## 2. Components and Responsibilities

### 2.1 AuthController (NestJS)

- **`POST /auth/login`**: Uses `LocalAuthGuard`, issues token pair, sets cookies.
- **`POST /auth/refresh`**: Uses `JwtRefreshGuard`, rotates refresh token via `AuthService.refreshTokens()`, sets new cookies.
- **`GET /auth/me`**: Protected via `JwtAuthGuard`, returns user profile.

### 2.2 AuthService (NestJS)

- **`login(user)`**: Calls `generateTokenPair()`.
- **`refreshTokens(user, oldToken)`**: Rotates refresh via `RefreshTokenService.rotateRefreshToken()`, signs new access token.

### 2.3 RefreshTokenService (NestJS)

- **`rotateRefreshToken(userId, oldToken?)`**: Deletes old whitelist record, signs new JWT refresh token, stores it with expiry in DB.
- **Cron Job**: Deletes expired tokens daily.

### 2.4 JwtStrategy (NestJS)

- Extracts `accessToken` from cookie, verifies signature & expiry, populates `req.user`.

### 2.5 JwtRefreshStrategy (NestJS)

- Extracts `refreshToken` from cookie, verifies signature, checks against whitelist, deletes old record, loads user.

### 2.6 CookieIoAdapter (NestJS)

- Subclasses `IoAdapter`, applies `cookie-parser` to every Socket.IO handshake so `socket.request.cookies` is populated.

### 2.7 AuthenticateWebsocketMiddleware (NestJS)

- Reads `socket.request.cookies.accessToken`, verifies JWT, populates `socket.data.user`.

### 2.8 Axios Client (Next.js)

- **Interceptor**: On 401, queue requests, call `/auth/refresh` once, retry queue. On refresh fail, redirect to `/login`.

### 2.9 Next.js Middleware (Next.js)

- Applies to `/dashboard/*`. Reads `accessToken` cookie, verifies locally via `jose`; if missing/expired, calls refresh once, sets new cookies, then proceeds or redirects.

### 2.10 Next.js Login Layout (App Router)

- On `app/auth/layout.tsx`, reads cookies, if valid access token → redirect to `/dashboard`; else if refresh token present → attempt refresh via `api.post('/auth/refresh')`; on success redirect; otherwise render login page.

---

## 3. Security Considerations

- **Http‑Only Cookies**: Prevent XSS from reading tokens.
- **SameSite Flags**: `Strict` for refresh, `Lax` for access.
- **Refresh Rotation**: One‑time use, stored in DB, deletes previous token.
- **CSRF Protection**: Access token not in cookie for API calls, requiring explicit header—mitigates CSRF risks.
- **Rate Limiting**: Throttler on login and refresh endpoints.

---

_Last updated: May 28, 2025_
