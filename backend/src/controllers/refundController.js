import { Refund } from '../models/Refund.js';
import { Reservation } from '../models/Reservation.js';
import { Property } from '../models/Property.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export const getRefundById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findOne({
      $or: [{ refund_id: id }, { refund_reference: id }]
    });

    if (!refund) {
      throw new NotFoundError(`Refund '${id}' not found`, 'REFUND_NOT_FOUND');
    }

    if (req.user.role === 'GUEST' && refund.guest_id !== req.user.guest_id) {
      throw new NotFoundError(`Refund '${id}' not found`, 'REFUND_NOT_FOUND');
    }

    if (req.user.role === 'PROPERTY_MANAGER') {
      const reservation = await Reservation.findOne({ reservation_id: refund.reservation_id });
      if (reservation) {
        const property = await Property.findOne({ property_id: reservation.property_id });
        if (property?.manager_user_id !== req.user.user_id) {
          throw new ForbiddenError('You do not manage the property for this refund', 'FORBIDDEN');
        }
      }
    }

    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

export const getAllRefunds = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user && req.user.role === 'PROPERTY_MANAGER') {
      const managedProps = await Property.find({ manager_user_id: req.user.user_id });
      const propIds = managedProps.map(p => p.property_id);
      const managedReservations = await Reservation.find({ property_id: { $in: propIds } }, 'reservation_id');
      const resIds = managedReservations.map(r => r.reservation_id);
      filter.reservation_id = { $in: resIds };
    }

    const refunds = await Refund.find(filter).sort({ refunded_at: -1 });
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};
