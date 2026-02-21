import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import config from '@/lib/config';

const COOKIE_NAME = 'prescriptoai_token';
const JWT_SECRET = new TextEncoder().encode(config.auth.jwtSecret);
const JWT_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_AGE_SEC}s`)
    .sign(JWT_SECRET);
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: JWT_AGE_SEC,
    path: '/',
  };
}

export {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  getCookieOptions,
};
