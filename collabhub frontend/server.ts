import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* =========================================================================
   1. TRANSCRIBE AUDIO (gemini-3.5-transcribe)
   Input audio from microphone (base64 audio data) -> transcribed text
========================================================================= */
app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType, prompt } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioData,
      },
    };

    const textPrompt = prompt || 'Please transcribe this classroom recording accurately into clean formatted text.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: textPrompt }],
      },
    });

    return res.json({
      transcription: response.text || '',
    });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to transcribe audio',
    });
  }
});

/* =========================================================================
   2. GENERATE VIDEO FROM TEXT (veo-3.1-fast-generate-preview)
   Aspect ratio: 16:9 (landscape) or 9:16 (portrait)
   3-Step Pattern: Start -> Poll Status -> Download Stream
========================================================================= */

// Step 1: Start Video Generation
app.post('/api/ai/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio, resolution } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video generation' });
    }

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    // Must use veo-3.1-fast-generate-preview as requested
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution || '720p',
        aspectRatio: validAspectRatio,
      },
    });

    return res.json({
      operationName: operation.name,
      prompt,
      aspectRatio: validAspectRatio,
    });
  } catch (error: any) {
    console.error('Video generation initiation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to start video generation',
    });
  }
});

// Step 2: Poll Video Status
app.post('/api/ai/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    return res.json({
      done: updated.done,
      error: updated.error || null,
    });
  } catch (error: any) {
    console.error('Video status check error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to poll video status',
    });
  }
});

// Step 3: Stream Completed Video Back
app.post('/api/ai/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Generated video URI not ready or not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to retrieve video stream from Google' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="generated_classroom_video.mp4"');

    if (videoRes.body) {
      // Pipe web stream to express response
      videoRes.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
          abort(err) {
            console.error('Stream aborted', err);
            res.end();
          },
        })
      );
    } else {
      const buffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error('Video download proxy error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to stream video',
    });
  }
});

// Health check endpoint for Cloud Run and container liveness
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Vite in dev mode or serve static dist in prod
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distPath);

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

