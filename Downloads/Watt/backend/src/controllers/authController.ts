import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, AuditLog } from '../db/schema.js';
import { env } from '../config/env.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user: any = await User.findOne({ email }).lean();
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    building_id: user.building_id,
  };

  const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('wattwise_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await AuditLog.create({
    user_id: user.id,
    action: 'USER_LOGIN',
    details: `User ${user.email} logged in successfully`,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: tokenPayload,
  });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('wattwise_token');
  if (req.user) {
    await AuditLog.create({
      user_id: req.user.id,
      action: 'USER_LOGOUT',
      details: `User ${req.user.email} logged out`,
      timestamp: new Date(),
    });
  }

  return res.json({ success: true, message: 'Logged out successfully' });
}

export async function getProfile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  return res.json({ success: true, user: req.user });
}
