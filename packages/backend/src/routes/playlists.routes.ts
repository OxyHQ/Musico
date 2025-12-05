import { Router } from 'express';
import {
  getUserPlaylists,
  getPlaylistById,
  createPlaylist,
} from '../controllers/playlists.controller';

const router = Router();

// Public routes
router.get('/:id', getPlaylistById);

// Authenticated routes
router.get('/', getUserPlaylists);
router.post('/', createPlaylist);

export default router;

