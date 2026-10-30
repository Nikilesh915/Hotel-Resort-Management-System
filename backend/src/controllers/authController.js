import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Guest } from '../models/Guest.js';
import { AuditLog } from '../models/AuditLog.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { JWT_SECRET } from '../middleware/auth.js';

export const registerGuest = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      throw new BadRequestError('Name, email, and password are required', 'MISSING_FIELDS');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new BadRequestError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const user_id = `USR-${String(userCount + 1).padStart(3, '0')}`;

    const user = await User.create({
      user_id,
      name,
      email: normalizedEmail,
      password_hash,
      role: 'GUEST',
      status: 'ACTIVE'
    });

    const guestCount = await Guest.countDocuments();
    const guest_id = `GST-${String(guestCount + 1).padStart(3, '0')}`;
    const guest_number = `GST-${String(guestCount + 1).padStart(5, '0')}`;

    const guest = await Guest.create({
      guest_id,
      user_id,
      guest_number,
      name,
      email: normalizedEmail,
      phone: phone || '',
      address: address || '',
      status: 'ACTIVE'
    });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        guest
      },
      message: 'Guest registration successful'
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError('Email and password are required', 'MISSING_CREDENTIALS');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is disabled or inactive', 'ACCOUNT_INACTIVE');
    }

    let guest = null;
    if (user.role === 'GUEST') {
      guest = await Guest.findOne({ user_id: user.user_id });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit Log
    const auditCount = await AuditLog.countDocuments();
    await AuditLog.create({
      audit_id: `AUD-${String(auditCount + 1).padStart(3, '0')}`,
      user_id: user.user_id,
      action: 'USER_LOGGED_IN',
      entity_type: 'USER',
      entity_id: user.user_id
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        guest
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select('-password_hash');
    let guest = null;
    if (user.role === 'GUEST') {
      guest = await Guest.findOne({ user_id: user.user_id });
    }

    res.status(200).json({
      success: true,
      data: { user, guest }
    });
  } catch (error) {
    next(error);
  }
};
