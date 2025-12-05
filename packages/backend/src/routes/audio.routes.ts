import { Router } from 'express';
import {
  streamAudio,
  getAudioInfo,
} from '../controllers/audio.controller';

const router = Router();

// Stream audio file with Range Request support
// Note: Authentication is required (handled by authenticatedApiRouter in server.ts)
// Uses MongoDB ObjectId: /api/audio/:trackId
router.get('/:trackId', streamAudio);

// Get audio file metadata
// Note: Authentication is required (handled by authenticatedApiRouter in server.ts)
// Uses MongoDB ObjectId: /api/audio/:trackId/info
router.get('/:trackId/info', getAudioInfo);

export default router;

