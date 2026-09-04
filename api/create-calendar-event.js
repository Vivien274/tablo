export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  const { webhookUrl, event } = body || {};
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Missing webhookUrl' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(event),
      redirect: 'follow',
    });

    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data || JSON.stringify({ status: 'success' }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
