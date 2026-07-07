import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getEnv } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { google } from 'googleapis';

const env = getEnv();

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign({ sub: userId, email, role }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(400, 'Validation failed');

    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) { next(err); }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) throw new AppError(400, 'Refresh token required');

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError(401, 'Invalid or expired refresh token');

    const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new AppError(401, 'User not found');

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    res.json({ accessToken });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

// GET /api/auth/google
export function googleAuth(_req: Request, res: Response) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_GMAIL_CLIENT_ID,
    env.GOOGLE_GMAIL_CLIENT_SECRET,
    env.GOOGLE_GMAIL_REDIRECT_URI,
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  });
  res.redirect(url);
}

// GET /api/auth/google/callback
export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.query as { code: string };
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_GMAIL_CLIENT_ID,
      env.GOOGLE_GMAIL_CLIENT_SECRET,
      env.GOOGLE_GMAIL_REDIRECT_URI,
    );
    const { tokens } = await oauth2Client.getToken(code);
    res.json({ message: 'Google OAuth successful', refreshToken: tokens.refresh_token });
  } catch (err) { next(err); }
}

// GET /api/auth/me
export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (err) { next(err); }
}
