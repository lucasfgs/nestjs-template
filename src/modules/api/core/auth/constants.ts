const isProduction = process.env.NODE_ENV === 'production';

export const jwtConstants = {
  accessExpiresIn: '15s',
  refreshExpiresIn: '30d',
};

function parseExpires(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 3600 * 1000,
    d: 24 * 3600 * 1000,
  };
  return value * (multipliers[unit] || 1000);
}

export const cookieConstants = {
  refresh: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: parseExpires(jwtConstants.refreshExpiresIn),
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  },
  access: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: parseExpires(jwtConstants.accessExpiresIn),
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  },
};
