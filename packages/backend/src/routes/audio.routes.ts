import { Router } from 'express';
import {
  streamAudio,
  getAudioInfo,
} from '../controllers/audio.controller';

const router = Router();

// Stream audio file with Range Request support
router.get('/:filename', streamAudio);

// Get audio file metadata
router.get('/:filename/info', getAudioInfo);

export default router;

