export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query?.url || new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('url');
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  let targetUrl = url;
  if (targetUrl.includes('photos.app.goo.gl') && !targetUrl.includes('_imcp=1')) {
    targetUrl += targetUrl.includes('?') ? '&_imcp=1' : '?_imcp=1';
  }

  try {
    const response = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send(err.message || 'Error fetching Google Photos album');
  }
}
