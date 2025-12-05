import { Router } from 'express';
import {
  getAlbums,
  getAlbumById,
  getAlbumTracks,
} from '../controllers/albums.controller';

const router = Router();

// Public routes
router.get('/', getAlbums);
router.get('/:id', getAlbumById);
router.get('/:id/tracks', getAlbumTracks);

export default router;

