import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Lazy-initialize Google GenAI SDK instance
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return aiClient;
}

app.use(express.json({ limit: '25mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'Surksha: AlertIQ Platform',
    mission: 'Sikshit Bharat, Surakshit Bharat',
    timestamp: new Date().toISOString(),
  });
});

// Generic Text / JSON Generation Endpoint (gemini-2.5-flash)
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { model = 'gemini-2.5-flash', contents, config } = req.body;
    const client = getGenAIClient();
    const response = await client.models.generateContent({
      model,
      contents,
      config,
    });
    res.json(response);
  } catch (error: any) {
    console.error('Error in /api/gemini/generate:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content.' });
  }
});

// SSE Streaming Chat Endpoint (gemini-2.5-flash)
app.post('/api/gemini/chat-stream', async (req: Request, res: Response) => {
  try {
    const { model = 'gemini-2.5-flash', contents, config } = req.body;
    const client = getGenAIClient();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.models.generateContentStream({
      model,
      contents,
      config,
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/gemini/chat-stream:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`);
    res.end();
  }
});

// Photorealistic Visual Simulation Image Generation (imagen-4.0-generate-001)
app.post('/api/gemini/imagen', async (req: Request, res: Response) => {
  try {
    const { model = 'imagen-4.0-generate-001', prompt, config } = req.body;
    const client = getGenAIClient();
    const response = await client.models.generateImages({
      model,
      prompt,
      config: config || { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    res.json(response);
  } catch (error: any) {
    console.error('Error in /api/gemini/imagen:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image.' });
  }
});

// WebSocket Relay for Gemini 2.5 Live Voice API ("Captain Surksha" with Zephyr voice)
wss.on('connection', (ws: WebSocket) => {
  console.log('[Live WebSocket] Client connected to Captain Surksha Voice Engine.');

  ws.on('message', async (data: Buffer) => {
    try {
      // In production, relay PCM chunks to Gemini Multimodal Live API session
      // and stream synthesized audio responses back to the client.
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {
      // Handle raw PCM binary audio chunks
    }
  });

  ws.on('close', () => {
    console.log('[Live WebSocket] Client disconnected.');
  });
});

// Production Static Files or Development Vite Middleware
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (err) {
    console.warn('[Vite Middleware] Vite could not be attached directly in middlewareMode; running standard router.');
  }
}

server.listen(PORT, () => {
  console.log(`[Surksha Platform] Server running on http://localhost:${PORT}`);
  console.log(`[Surksha Platform] Ethos: "Sikshit Bharat, Surakshit Bharat"`);
});
