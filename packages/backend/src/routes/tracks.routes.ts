import { Router } from 'express';
import {
  getTracks,
  getTrackById,
  searchTracks,
  uploadTrack,
} from '../controllers/tracks.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getTracks);
router.get('/search', searchTracks);
router.get('/:id', getTrackById);

// Authenticated routes
router.post('/upload', requireAuth, uploadTrack);

export default router;

