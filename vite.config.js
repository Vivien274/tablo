import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = path.resolve(process.cwd(), 'tablo-config.json');

const DEFAULT_CONFIG = {
  calendars: [
    {
      id: 'cal-vivien',
      name: 'Vivien',
      color: '#38bdf8',
      url: 'https://calendar.google.com/calendar/ical/vivien274%40gmail.com/private-72f1bfe6d142f4988834d66bd8edc7fc/basic.ics',
      enabled: true,
    },
  ],
  calendarWebhookUrl: '',
  googleAlbumUrl: 'https://photos.app.goo.gl/jDck5X2YPCZ99N868',
  city: { name: 'Comines', label: 'Comines (Nord)', lat: 50.7608, lon: 3.0075 },
};

function readCentralConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading tablo-config.json:', err);
  }
  return DEFAULT_CONFIG;
}

function writeCentralConfig(updates) {
  try {
    const current = readCentralConfig();
    const merged = { ...current, ...updates };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('Error writing tablo-config.json:', err);
    return null;
  }
}

// Custom plugin for proxying Google Photos & iCal Calendars
const tabloProxyPlugin = {
  name: 'tablo-proxy-plugin',
  configureServer(server) {
    // 0. Configuration centralisée (partagée entre Mac, iPad et tout appareil)
    server.middlewares.use('/api/config', (req, res) => {
      if (req.method === 'GET') {
        const config = readCentralConfig();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(JSON.stringify(config));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const updates = JSON.parse(body || '{}');
            const saved = writeCentralConfig(updates);
            if (saved) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'success', config: saved }));
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to write config' }));
            }
          } catch (err) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      res.statusCode = 405;
      res.end('Method Not Allowed');
    });
    // 1. Proxy pour les albums Google Photos
    server.middlewares.use('/api/fetch-album', async (req, res) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      let targetUrl = parsedUrl.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.end('Missing url parameter');
        return;
      }
      if (targetUrl.includes('photos.app.goo.gl') && !targetUrl.includes('_imcp=1')) {
        targetUrl += targetUrl.includes('?') ? '&_imcp=1' : '?_imcp=1';
      }
      try {
        const response = await fetch(targetUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });
        const html = await response.text();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      } catch (err) {
        res.statusCode = 500;
        res.end(err.message || 'Error fetching album');
      }
    });

    // 2. Proxy d'image pour servir les photos en local sans aucun blocage CORS
    server.middlewares.use('/api/image-proxy', async (req, res) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const targetUrl = parsedUrl.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.end('Missing url parameter');
        return;
      }
      try {
        const imageRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = await imageRes.arrayBuffer();
        res.end(Buffer.from(buffer));
      } catch (err) {
        res.statusCode = 500;
        res.end('Image proxy error');
      }
    });

    // 3. Proxy pour synchroniser les calendriers iCal / Google Calendar / Apple iCloud
    server.middlewares.use('/api/fetch-calendar', async (req, res) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      let targetUrl = parsedUrl.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.end('Missing url parameter');
        return;
      }
      // Remplacer webcal:// par https://
      if (targetUrl.startsWith('webcal://')) {
        targetUrl = targetUrl.replace('webcal://', 'https://');
      }
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Tablo/1.0 (Family Wall Dashboard; macOS/iPadOS)',
            'Accept': 'text/calendar, application/json, text/plain',
          },
        });
        const icsText = await response.text();
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.end(icsText);
      } catch (err) {
        res.statusCode = 500;
        res.end(err.message || 'Error fetching calendar');
      }
    });

    // 4. Proxy pour créer des événements Google Calendar via Google Apps Script Webhook
    server.middlewares.use('/api/create-calendar-event', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const { webhookUrl, event } = JSON.parse(body);
          if (!webhookUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing webhookUrl' }));
            return;
          }

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(event),
            redirect: 'follow',
          });

          const data = await response.text();
          res.setHeader('Content-Type', 'application/json');
          res.end(data || JSON.stringify({ status: 'success' }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tabloProxyPlugin,
  ],
  server: {
    host: true, // Expose automatiquement sur le réseau local (WiFi / Ethernet)
  },
})
