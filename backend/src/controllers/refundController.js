import { Refund } from '../models/Refund.js';
import { NotFoundError } from '../utils/errors.js';

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

    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

export const getAllRefunds = async (req, res, next) => {
  try {
    const refunds = await Refund.find().sort({ refunded_at: -1 });
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

