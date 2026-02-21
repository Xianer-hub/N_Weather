import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const OPENWEATHER_API_KEY = process.env.VITE_OPENWEATHER_API_KEY?.trim();
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
  });

  app.use('/api', limiter);

  // API Routes
  app.get('/api/weather/current', async (req, res) => {
    const { q, units = 'metric', lang = 'zh_tw' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing city parameter' });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: { q, appid: OPENWEATHER_API_KEY, units, lang },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to fetch weather';
      res.status(status).json({ error: message });
    }
  });

  app.get('/api/weather/forecast', async (req, res) => {
    const { q, units = 'metric', lang = 'zh_tw' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing city parameter' });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: { q, appid: OPENWEATHER_API_KEY, units, lang },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to fetch forecast';
      res.status(status).json({ error: message });
    }
  });

  app.get('/api/weather/search', async (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
      const response = await axios.get(`${BASE_URL}/find`, {
        params: { q, type: 'like', sort: 'population', appid: OPENWEATHER_API_KEY },
      });
      const cities = response.data.list?.slice(0, 5).map((item: any) => ({
        id: item.id,
        name: item.name,
        country: item.sys?.country,
      })) || [];
      res.json(cities);
    } catch (error: any) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static('dist', {
      etag: false,
      lastModified: false,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    }));

    // Fallback to index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
