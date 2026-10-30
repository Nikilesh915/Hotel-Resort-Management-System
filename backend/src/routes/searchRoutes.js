import { Router } from 'express';
import { searchAvailableRooms, getPricingQuote } from '../controllers/searchController.js';

const router = Router();

router.get('/availability', searchAvailableRooms);
router.post('/quote', getPricingQuote);

export default router;
