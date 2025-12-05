import { Router } from 'express';
import {
  getArtists,
  getArtistById,
  getArtistAlbums,
  followArtist,
  unfollowArtist,
} from '../controllers/artists.controller';

const router = Router();

// Public routes
router.get('/', getArtists);
router.get('/:id', getArtistById);
router.get('/:id/albums', getArtistAlbums);

// Authenticated routes
router.post('/:id/follow', followArtist);
router.post('/:id/unfollow', unfollowArtist);

export default router;

