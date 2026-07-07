import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Role from '../models/Role';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
    branch?: string;
  };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'salon_erp_access_secret_token_2026_xyz';
    const decoded = jwt.verify(token, secret) as { id: string; role: string; branch?: string };

    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}.` });
    }

    const userRole = user.role as any; // Cast populated role
    req.user = {
      id: user._id.toString(),
      role: userRole.name,
      permissions: userRole.permissions || [],
      branch: user.branch?.toString()
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Super Admin overrides all permission checks
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
};
