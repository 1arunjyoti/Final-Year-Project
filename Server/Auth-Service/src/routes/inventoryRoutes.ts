import { Router } from 'express';
import { createInventory } from '../controllers/inventoryController';
import { protect } from '../middlwares/protect'; // Assuming you have a protect middleware for authentication

const router = Router();

router.post('/store', protect, createInventory);

export default router;