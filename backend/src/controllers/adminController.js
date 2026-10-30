import { Reservation } from '../models/Reservation.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { Property } from '../models/Property.js';
import { Room } from '../models/Room.js';
import { AuditLog } from '../models/AuditLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const isManager = req.user.role === 'PROPERTY_MANAGER';
    let managedPropertyIds = null;

    if (isManager) {
      const properties = await Property.find({ manager_user_id: req.user.user_id });
      managedPropertyIds = properties.map(p => p.property_id);
    }

    const reservationFilter = managedPropertyIds ? { property_id: { $in: managedPropertyIds } } : {};
    const roomFilter = managedPropertyIds ? { property_id: { $in: managedPropertyIds } } : {};

    // 1. Total Rooms & Active Inventory
    const [totalRooms, availableRooms, maintenanceRooms] = await Promise.all([
      Room.countDocuments(roomFilter),
      Room.countDocuments({ ...roomFilter, status: 'AVAILABLE' }),
      Room.countDocuments({ ...roomFilter, status: 'MAINTENANCE' })
    ]);

    // 2. Reservation Metrics
    const [totalReservations, confirmedCount, checkedInCount, cancelledCount, refundedCount] = await Promise.all([
      Reservation.countDocuments(reservationFilter),
      Reservation.countDocuments({ ...reservationFilter, status: 'CONFIRMED' }),
      Reservation.countDocuments({ ...reservationFilter, status: 'CHECKED_IN' }),
      Reservation.countDocuments({ ...reservationFilter, status: 'CANCELLED' }),
      Reservation.countDocuments({ ...reservationFilter, status: 'REFUNDED' })
    ]);

    // 3. Financial Metrics (Total Paid Revenue - Total Refunds)
    const reservations = await Reservation.find(reservationFilter, 'reservation_id');
    const resIds = reservations.map(r => r.reservation_id);

    const payments = await Payment.find({
      reservation_id: { $in: resIds },
      status: { $in: ['SUCCESS', 'REFUNDED'] }
    });
    const grossRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    const refunds = await Refund.find({
      reservation_id: { $in: resIds },
      status: 'SUCCESS'
    });
    const totalRefunded = refunds.reduce((acc, r) => acc + r.refund_amount, 0);
    const netRevenue = grossRevenue - totalRefunded;

    // 4. Occupancy Rate Estimate
    const activeOccupied = confirmedCount + checkedInCount;
    const occupancyRate = totalRooms > 0 ? Math.round((activeOccupied / totalRooms) * 100 * 10) / 10 : 0;
    const cancellationRate = totalReservations > 0
      ? Math.round(((cancelledCount + refundedCount) / totalReservations) * 100 * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: {
        inventory: {
          total_rooms: totalRooms,
          available_rooms: availableRooms,
          maintenance_rooms: maintenanceRooms
        },
        reservations: {
          total: totalReservations,
          active: activeOccupied,
          confirmed: confirmedCount,
          checked_in: checkedInCount,
          cancelled: cancelledCount,
          refunded: refundedCount,
          cancellation_rate: `${cancellationRate}%`
        },
        financials: {
          gross_revenue: grossRevenue,
          total_refunded: totalRefunded,
          net_revenue: netRevenue,
          currency: 'INR'
        },
        kpis: {
          occupancy_rate: `${occupancyRate}%`
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { entity_type, action, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (entity_type) filter.entity_type = entity_type;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ created_at: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        total,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};
