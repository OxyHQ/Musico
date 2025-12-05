import { Router } from 'express';
import {
  getTracks,
  getTrackById,
  searchTracks,
} from '../controllers/tracks.controller';

const router = Router();

// Public routes
router.get('/', getTracks);
router.get('/search', searchTracks);
router.get('/:id', getTrackById);

export default router;

