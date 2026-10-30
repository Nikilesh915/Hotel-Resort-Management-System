import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Guest } from '../models/Guest.js';
import { UnauthorizedError } from '../utils/errors.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'hotel_super_secure_jwt_secret_key_2026';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required', 'TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({ user_id: decoded.user_id, status: 'ACTIVE' });
    if (!user) {
      throw new UnauthorizedError('User account not found or inactive', 'USER_NOT_FOUND');
    }

    let guestId = null;
    if (user.role === 'GUEST') {
      const guest = await Guest.findOne({ user_id: user.user_id });
      if (guest) {
        guestId = guest.guest_id;
      }
    }

    req.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      guest_id: guestId
    };

    next();
  } catch (error) {
    next(error);
  }
};

