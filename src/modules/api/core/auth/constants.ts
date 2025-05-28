const isProduction = process.env.NODE_ENV === 'production';

export const jwtConstants = {
  accessExpiresIn: 15 * 1000, // 5 seconds
  refreshExpiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const sessionConstants = {};

export const cookieConstants = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: jwtConstants.refreshExpiresIn,
  path: '/',
  domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
};
