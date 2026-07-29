import express from 'express';
const router = express.Router();
import { search } from '../controllers/search.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

router.get('/', authenticate, search);

export default router;
