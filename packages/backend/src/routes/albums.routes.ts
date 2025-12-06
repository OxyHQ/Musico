import { Router } from 'express';
import {
  getAlbums,
  getAlbumById,
  getAlbumTracks,
  createAlbum,
} from '../controllers/albums.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAlbums);
router.get('/:id', getAlbumById);
router.get('/:id/tracks', getAlbumTracks);

// Authenticated routes
router.post('/', requireAuth, createAlbum);

export default router;

