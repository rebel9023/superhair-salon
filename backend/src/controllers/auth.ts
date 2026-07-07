import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Branch from '../models/Branch';
import ErrorHandler from '../utils/ErrorHandler';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  sendTokenCookies,
  clearTokenCookies
} from '../utils/token';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/auth';

// Register standard users / Owner accounts
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, branch, roleName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler('Email is already registered', 400));
    }

    // Default to 'salon_owner' role if not specified
    const rName = roleName || 'salon_owner';
    const dbRole = await Role.findOne({ name: rName });
    if (!dbRole) {
      return next(new ErrorHandler(`Role ${rName} not found. Seed the roles first.`, 400));
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      phone,
      branch: branch || null,
      role: dbRole._id,
      status: rName === 'salon_owner' ? 'active' : 'pending', // Auto-active for owner, pending for others
      isEmailVerified: rName === 'salon_owner', // Auto-verified for owner
      verificationToken
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: rName,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    if (user.status !== 'active') {
      return next(new ErrorHandler(`Your account is ${user.status}. Please contact admin.`, 403));
    }

    const userRole = user.role as any;
    const tokenPayload = {
      id: user._id.toString(),
      role: userRole.name,
      branch: user.branch?.toString()
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to user array (rotation)
    user.refreshTokens.push(refreshToken);
    // Keep max 5 active refresh tokens to prevent bloating
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    sendTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole.name,
        permissions: userRole.permissions,
        branch: user.branch,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // Find user and pull refresh token
      await User.findOneAndUpdate(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    }

    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Access Token
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return next(new ErrorHandler('No refresh token provided', 401));
    }

    const user = await User.findOne({ refreshTokens: refreshToken }).populate('role');
    if (!user) {
      clearTokenCookies(res);
      return next(new ErrorHandler('Session expired. Please login again.', 401));
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'salon_erp_refresh_secret_token_2026_abc';
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch (err) {
      // Token is invalid/expired, remove it
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      await user.save();
      clearTokenCookies(res);
      return next(new ErrorHandler('Session expired. Please login again.', 401));
    }

    const userRole = user.role as any;
    const tokenPayload = {
      id: user._id.toString(),
      role: userRole.name,
      branch: user.branch?.toString()
    };

    // Rotate tokens
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Swap old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    sendTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole.name,
        permissions: userRole.permissions,
        branch: user.branch
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current profile details
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler('Unauthorized', 401));
    }
    const user = await User.findById(req.user.id).populate('role').populate('branch');
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler('User not found with this email', 404));
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Mock Mail Delivery (Print in console)
    console.log(`[MAIL] Password Reset Link: http://localhost:5173/reset-password/${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link generated. Check console logs in dev mode.',
      resetToken // sending for developer testing convenience
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return next(new ErrorHandler('Password reset token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = []; // Log out from all sessions on password change
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Check if Super Admin is setup/initialized in database
export const checkSetupStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      return res.json({ success: true, isInitialized: false });
    }
    const count = await User.countDocuments({ role: superAdminRole._id });
    return res.json({ success: true, isInitialized: count > 0 });
  } catch (error) {
    next(error);
  }
};

// First-time setup super admin creation
export const setupAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (superAdminRole) {
      const count = await User.countDocuments({ role: superAdminRole._id });
      if (count > 0) {
        return next(new ErrorHandler('Setup has already been completed. This action is forbidden.', 403));
      }
    } else {
      superAdminRole = await Role.create({
        name: 'super_admin',
        description: 'Super administrator with full system control.',
        permissions: ['*']
      });
    }

    const { salonName, name, email, password, phone } = req.body;

    // Validate password constraints (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(new ErrorHandler('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler('Email is already registered.', 400));
    }

    let branch = await Branch.findOne({ code: 'BR001' });
    if (!branch) {
      branch = await Branch.create({
        name: salonName || 'Super Hair Art Unisex Salon',
        code: 'BR001',
        address: {
          street: '45 Hill Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400050',
          country: 'India'
        },
        contact: phone || '+919723290486',
        email: email,
        gstNumber: '27AAAAA1111A1Z1',
        invoicePrefix: 'INV-BR1-',
        status: 'active',
        settings: { currency: '₹', timezone: 'Asia/Kolkata', taxRate: 0 }
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: superAdminRole._id,
      branch: branch._id,
      status: 'active',
      isEmailVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Redirecting to login.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};
