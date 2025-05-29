## Google OAuth Integration Guide

This guide explains how to configure and integrate Google OAuth 2.0 in your NestJS API and Next.js frontend in a stateless fashion, issuing JWT access and refresh cookies as part of your existing authentication flow.

---

## 1. Prerequisites

- A Google Cloud project with an OAuth 2.0 Client ID and Client Secret (https://console.cloud.google.com/apis/credentials).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables set in your backend.
- `API_URL` pointing to your NestJS server (e.g. `http://localhost:4000`).
- `APP_URL` pointing to your Next.js app (e.g. `http://localhost:3000`).

---

## 2. Backend (NestJS)

### 2.1 Install Dependencies

```bash
npm install passport-google-oauth20 @nestjs/passport passport
```

### 2.2 Implement the Google Strategy

Create `src/auth/strategies/google.strategy.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL}/auth/google/callback`,
      scope: ['email', 'profile'],
      session: false,
      state: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<IAuthenticatedUser> {
    // Upsert or find the user by Google profile
    return this.authService.validateOAuthLogin(
      'google',
      profile.id,
      profile.emails![0].value,
      profile.displayName,
    );
  }
}
```

### 2.3 Register the Strategy and Guard

In `src/auth/google.guard.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({ session: false, state: false });
  }
}
```

Add to `AuthModule` providers:

```ts
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './google.guard';

@Module({
  imports: [PassportModule.register({ session: false })],
  providers: [GoogleStrategy, GoogleAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
```

### 2.4 Controller Endpoints

In `src/auth/auth.controller.ts`:

```ts
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res({ passthrough: true }) res) {
    const user = req.user as IAuthenticatedUser;
    const { accessToken, refreshToken } =
      await this.authService.generateTokenPair(
        user.sub,
        user,
        req.cookies['refreshToken'],
      );

    res.cookie('accessToken', accessToken, cookieConstants.access);
    res.cookie('refreshToken', refreshToken, cookieConstants.refresh);
    return res.redirect(`${process.env.APP_URL}/dashboard`);
  }
}
```

---

## 3. Frontend (Next.js)

### 3.1 Sign‑in Button

Create a component, e.g. `components/GoogleSignIn.tsx`:

```tsx
export function GoogleSignInButton() {
  return (
    <a href={`${process.env.API_URL}/auth/google`}>
      <button>Sign in with Google</button>
    </a>
  );
}
```

Include this on your `/auth/login` page alongside your local form.

### 3.2 Redirect Handling

Your Next.js `app/auth/layout.tsx` or middleware will detect the freshly set cookies and redirect to `/dashboard`, as per your existing flow. No client‑side JWT extraction is needed for Google login.

---

## 4. Security and Recommendations

- Use `state` manually if you need CSRF protection for OAuth flows without sessions.
- Restrict `callbackURL` to HTTPS and production domains in Google Cloud Console.
- Validate and sanitize the Google profile data before upserting users.

---

_Last updated: May 28, 2025_
