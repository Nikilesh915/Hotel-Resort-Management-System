import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';
import { Reservation } from '../src/models/Reservation.js';
import { Payment } from '../src/models/Payment.js';
import { Refund } from '../src/models/Refund.js';

setupTestDB();

describe('The Eight Technical Challenges - Comprehensive Test Suite', () => {
  let guestToken;
  let adminToken;
  let guestTwoToken;

  beforeEach(async () => {
    // Login Guest One
    const guestRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest1@example.com', password: 'Password123!' });
    guestToken = guestRes.body.data.token;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    // Login Guest Two
    const guestTwoRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest2@example.com', password: 'Password123!' });
    guestTwoToken = guestTwoRes.body.data.token;
  });

  // ==========================================
  // CHALLENGE 1: The Double-Booking Problem
  // ==========================================
  test('Challenge 1: Concurrent requests for the same room and dates should result in exactly 1 success and conflicts for the rest', async () => {
    // ROOM-102 is available for Nov 10 - Nov 15
    const payload = {
      property_id: 'PROP-001',
      room_id: 'ROOM-102',
      check_in_date: '2024-11-10T14:00:00Z',
      check_out_date: '2024-11-15T11:00:00Z',
      guests_count: 2
    };

    // Fire 10 parallel reservation requests simultaneously
    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(payload)
    );

    const responses = await Promise.all(requests);
    const successes = responses.filter(r => r.status === 201);
    const conflicts = responses.filter(r => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(9);

    // Verify database has exactly 1 reservation for these dates
    const dbReservations = await Reservation.find({
      room_id: 'ROOM-102',
      check_in_date: new Date('2024-11-10T14:00:00Z')
    });
    expect(dbReservations.length).toBe(1);
  }, 30000);

  // ==========================================
  // CHALLENGE 2: Date-Range Overlap Problem
  // ==========================================
  describe('Challenge 2: Date-Range Overlap Logic', () => {
    // RES-001 in mock_data is ROOM-101 from 2024-09-20 to 2024-09-25
    test('Rejects partial overlap (starts before, ends inside: Sep 18 - Sep 21)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-101',
          check_in_date: '2024-09-18T14:00:00Z',
          check_out_date: '2024-09-21T11:00:00Z',
          guests_count: 2
        });
      expect(res.status).toBe(409);
    });

    test('Rejects partial overlap (starts inside, ends after: Sep 23 - Sep 28)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-101',
          check_in_date: '2024-09-23T14:00:00Z',
          check_out_date: '2024-09-28T11:00:00Z',
          guests_count: 2
        });
      expect(res.status).toBe(409);
    });

    test('Allows adjacent reservation starting on the same day existing reservation checks out (Sep 25 - Sep 30)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-101',
          check_in_date: '2024-09-25T14:00:00Z',
          check_out_date: '2024-09-30T11:00:00Z',
          guests_count: 2
        });
      expect(res.status).toBe(201);
    });

    test('Rejects same-day check-in/check-out (minimum 1 night required)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-102',
          check_in_date: '2024-11-20T14:00:00Z',
          check_out_date: '2024-11-20T18:00:00Z',
          guests_count: 1
        });
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // CHALLENGE 3: The Price Manipulation Problem
  // ==========================================
  test('Challenge 3: Backend ignores manipulated prices/discounts and strictly calculates correct amount server-side', async () => {
    // Malicious user sends fake price = 500, discount = 9999, tax = 0, total = 500
    const maliciousPayload = {
      property_id: 'PROP-001',
      room_id: 'ROOM-102',
      check_in_date: '2024-11-01T14:00:00Z',
      check_out_date: '2024-11-04T11:00:00Z', // 3 nights @ 3000 = 9000
      guests_count: 2,
      base_amount: 500,
      discount_amount: 9999,
      tax_amount: 0,
      service_fee: 0,
      total_amount: 500
    };

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${guestToken}`)
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    const reservation = res.body.data;

    // Server-calculated verification: 3 nights * 3000 = 9000 base, 0 discount, 12% tax = 1080, 500 fee = 10580 total
    expect(reservation.base_amount).toBe(9000);
    expect(reservation.discount_amount).toBe(0);
    expect(reservation.tax_amount).toBe(1080);
    expect(reservation.service_fee).toBe(500);
    expect(reservation.total_amount).toBe(10580);
  });

  // ==========================================
  // CHALLENGE 4: The Coupon Abuse Problem
  // ==========================================
  describe('Challenge 4: Coupon Abuse Protections', () => {
    test('Rejects expired coupon (OLD10)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-102',
          check_in_date: '2024-11-01T14:00:00Z',
          check_out_date: '2024-11-04T11:00:00Z',
          guests_count: 2,
          coupon_code: 'OLD10'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COUPON_EXPIRED');
    });

    test('Rejects disabled coupon (BLOCKED50)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-102',
          check_in_date: '2024-11-01T14:00:00Z',
          check_out_date: '2024-11-04T11:00:00Z',
          guests_count: 2,
          coupon_code: 'BLOCKED50'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COUPON_INACTIVE');
    });

    test('Rejects coupon when minimum booking amount is not met', async () => {
      // SAVE20 requires minimum booking of 10000. 1 night in ROOM-102 is 3000.
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-102',
          check_in_date: '2024-11-01T14:00:00Z',
          check_out_date: '2024-11-02T11:00:00Z',
          guests_count: 1,
          coupon_code: 'SAVE20'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COUPON_MINIMUM_NOT_MET');
    });

    test('Rejects coupon when customer has already reached their per-customer limit', async () => {
      // Guest Two already redeemed CPN-002 (FLAT1500) which has per_customer_limit = 1
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestTwoToken}`)
        .send({
          property_id: 'PROP-001',
          room_id: 'ROOM-102',
          check_in_date: '2024-11-01T14:00:00Z',
          check_out_date: '2024-11-04T11:00:00Z',
          guests_count: 2,
          coupon_code: 'FLAT1500'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COUPON_CUSTOMER_LIMIT_REACHED');
    });
  });

  // ==========================================
  // CHALLENGE 5: Reservation State Machine Problem
  // ==========================================
  describe('Challenge 5: Reservation State Machine Enforcement', () => {
    test('Rejects invalid transition: CHECKED_OUT -> CONFIRMED', async () => {
      // RES-003 is CHECKED_OUT
      const res = await request(app)
        .put('/api/reservations/RES-003/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });

    test('Rejects check-in on a CANCELLED reservation', async () => {
      // RES-004 is CANCELLED
      const res = await request(app)
        .put('/api/reservations/RES-004/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CHECKED_IN' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });

    test('Allows valid transition: CONFIRMED -> CHECKED_IN -> CHECKED_OUT', async () => {
      // RES-001 is CONFIRMED
      const checkInRes = await request(app)
        .put('/api/reservations/RES-001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CHECKED_IN' });
      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.data.status).toBe('CHECKED_IN');

      const checkOutRes = await request(app)
        .put('/api/reservations/RES-001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CHECKED_OUT' });
      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.data.status).toBe('CHECKED_OUT');
    });
  });

  // ==========================================
  // CHALLENGE 6: The Duplicate Payment Problem & Idempotency
  // ==========================================
  test('Challenge 6: Idempotent payment processing prevents double charging on request retries', async () => {
    // RES-005 is PENDING
    const idempotency_key = 'idem-test-pay-12345';

    // 1st attempt: Process payment
    const firstRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${guestTwoToken}`)
      .send({
        reservation_id: 'RES-005',
        payment_method: 'CARD',
        idempotency_key
      });

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.data.status).toBe('SUCCESS');
    expect(firstRes.body.is_idempotent_replay).toBe(false);

    // 2nd attempt (Replay with same idempotency key): Should return 200 with existing transaction
    const secondRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${guestTwoToken}`)
      .send({
        reservation_id: 'RES-005',
        payment_method: 'CARD',
        idempotency_key
      });

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.is_idempotent_replay).toBe(true);
    expect(secondRes.body.data.payment_id).toBe(firstRes.body.data.payment_id);

    // Verify only 1 payment was created for this key
    const paymentsCount = await Payment.countDocuments({ idempotency_key });
    expect(paymentsCount).toBe(1);
  });

  // ==========================================
  // CHALLENGE 7: Cancellation & Refund Integrity
  // ==========================================
  describe('Challenge 7: Cancellation & Refund Integrity', () => {
    test('Server calculates cancellation fee & refund strictly; client cannot tamper with amounts', async () => {
      // RES-001 is CONFIRMED with total_amount = 17300, policy STRICT
      const res = await request(app)
        .post('/api/reservations/RES-001/cancel')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          reason: 'Personal reason',
          refund_amount: 999999, // Malicious client attempt
          cancellation_fee: 0
        });

      expect(res.status).toBe(200);
      const { refund, reservation } = res.body.data;
      expect(reservation.status).toBe('REFUNDED');
      expect(refund.original_amount).toBe(17300);
      // Backend evaluated policy and computed refund amount strictly on server
      expect(refund.refund_amount).toBeLessThanOrEqual(17300);
      expect(refund.refund_amount + refund.cancellation_fee).toBe(17300);
    });

    test('Prevents duplicate refund for the same reservation', async () => {
      // RES-004 in mock data already has REF-001
      const res = await request(app)
        .post('/api/reservations/RES-004/cancel')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Try refund again' });

      // Should be rejected because already cancelled/refunded
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_RESERVATION');
    });
  });

  // ==========================================
  // CHALLENGE 8: Unauthorized Access & IDOR
  // ==========================================
  describe('Challenge 8: Resource Ownership & IDOR Protection', () => {
    test('Guest A cannot view Guest B reservation (GET /api/reservations/RES-002 returns 404)', async () => {
      // Guest 1 attempts to access RES-002 (owned by Guest 2)
      const res = await request(app)
        .get('/api/reservations/RES-002')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESERVATION_NOT_FOUND');
    });

    test('Guest cannot cancel another guest reservation', async () => {
      // Guest 1 attempts to cancel RES-005 (owned by Guest 2)
      const res = await request(app)
        .post('/api/reservations/RES-005/cancel')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Malicious cancellation' });

      expect(res.status).toBe(404);
    });

    test('Guest cannot modify room inventory or pricing', async () => {
      const res = await request(app)
        .put('/api/rooms/ROOM-101/status')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ status: 'MAINTENANCE' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_PERMITTED');
    });

    test('Admin has authority to view any reservation', async () => {
      const res = await request(app)
        .get('/api/reservations/RES-002')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reservation_id).toBe('RES-002');
    });
  });
});

