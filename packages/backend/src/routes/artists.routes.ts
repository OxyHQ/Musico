import { Router } from 'express';
import {
  getArtists,
  getArtistById,
  getArtistAlbums,
  followArtist,
  unfollowArtist,
  registerAsArtist,
  getMyArtistProfile,
  getArtistDashboard,
  getArtistInsights,
} from '../controllers/artists.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getArtists);
router.get('/:id', getArtistById);
router.get('/:id/albums', getArtistAlbums);

// Authenticated routes
router.post('/:id/follow', requireAuth, followArtist);
router.post('/:id/unfollow', requireAuth, unfollowArtist);

// Artist management routes (authenticated)
router.post('/register', requireAuth, registerAsArtist);
router.get('/me', requireAuth, getMyArtistProfile);
router.get('/me/dashboard', requireAuth, getArtistDashboard);
router.get('/me/insights', requireAuth, getArtistInsights);

export default router;

