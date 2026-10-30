import { ForbiddenError } from '../utils/errors.js';
import { Property } from '../models/Property.js';

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Access forbidden: insufficient role permissions', 'ROLE_NOT_PERMITTED'));
    }
    next();
  };
};

export const requirePropertyAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role === 'PROPERTY_MANAGER') {
      const propertyId = req.params.propertyId || req.params.id || req.body.property_id;
      if (!propertyId) {
        return next();
      }

      const property = await Property.findOne({ property_id: propertyId });
      if (!property) {
        return next(new ForbiddenError('Property not found or inaccessible', 'PROPERTY_ACCESS_DENIED'));
      }

      if (property.manager_user_id !== req.user.user_id) {
        return next(new ForbiddenError('Access forbidden: you do not manage this property', 'NOT_PROPERTY_MANAGER'));
      }

      return next();
    }

    return next(new ForbiddenError('Access forbidden', 'FORBIDDEN'));
  } catch (error) {
    next(error);
  }
};
