export default async function handler(req, res) {
  const url = req.query?.url || new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('url');
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  let targetUrl = url;
  if (targetUrl.startsWith('webcal://')) {
    targetUrl = targetUrl.replace('webcal://', 'https://');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Tablo/1.0 (Family Wall Dashboard; Vercel Serverless)',
        'Accept': 'text/calendar, application/json, text/plain',
      },
    });

    const icsText = await response.text();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(icsText);
  } catch (err) {
    res.status(500).send(err.message || 'Error fetching calendar');
  }
}
