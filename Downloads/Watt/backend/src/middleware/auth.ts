import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../db/schema.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FACILITY_MANAGER' | 'BUILDING_ADMIN' | 'AUDITOR';
  building_id?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.wattwise_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    
    const user: any = await User.findOne({ id: decoded.id }).lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer active' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      building_id: user.building_id,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
}

export function verifyEsp32Key(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-esp32-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== env.ESP32_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized ESP32 device credentials' });
  }

  next();
}
