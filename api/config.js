import fs from 'node:fs';
import path from 'node:path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const configPath = path.resolve(process.cwd(), 'tablo-config.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8');
        return res.status(200).json(JSON.parse(data));
      }
    } catch (e) {}
    return res.status(200).json({});
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    try {
      let current = {};
      if (fs.existsSync(configPath)) {
        current = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      const merged = { ...current, ...body };
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
      return res.status(200).json({ status: 'success', config: merged });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
