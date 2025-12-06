import { Router } from 'express';
import {
  getArtists,
  getArtistById,
  getArtistAlbums,
  getArtistTracks,
  followArtist,
  unfollowArtist,
  registerAsArtist,
  getMyArtistProfile,
  getArtistDashboard,
  getArtistInsights,
} from '../controllers/artists.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Artist management routes (authenticated) - Must be before /:id routes!
router.post('/register', requireAuth, registerAsArtist);
router.get('/me', requireAuth, getMyArtistProfile);
router.get('/me/dashboard', requireAuth, getArtistDashboard);
router.get('/me/insights', requireAuth, getArtistInsights);

// Public routes
router.get('/', getArtists);
router.get('/:id', getArtistById);
router.get('/:id/albums', getArtistAlbums);
router.get('/:id/tracks', getArtistTracks);

// Authenticated routes
router.post('/:id/follow', requireAuth, followArtist);
router.post('/:id/unfollow', requireAuth, unfollowArtist);

export default router;

