const isProduction = process.env.NODE_ENV === 'production';

export const jwtConstants = {
  accessExpiresIn: '15s',
  refreshExpiresIn: '30d',
};

export const sessionConstants = {};

export const cookieConstants = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
  domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
};
