// Service d'extraction et de synchronisation des albums partagés Google Photos

export async function fetchSharedGooglePhotosAlbum(albumUrl) {
  if (!albumUrl || !albumUrl.trim()) {
    throw new Error("L'URL de l'album est requise.");
  }

  let cleanUrl = albumUrl.trim();
  if (cleanUrl.includes('photos.app.goo.gl') && !cleanUrl.includes('_imcp=1')) {
    cleanUrl += cleanUrl.includes('?') ? '&_imcp=1' : '?_imcp=1';
  }

  let html = '';

  // 1. Essai via le proxy local Vite
  try {
    const proxyUrl = `/api/fetch-album?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.warn('Local proxy failed, trying public CORS fallback:', err);
  }

  // 2. Fallback via proxy public si nécessaire
  if (!html || html.length < 500) {
    try {
      const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(corsProxy);
      if (res.ok) {
        html = await res.text();
      }
    } catch (err) {
      console.error('All CORS proxies failed:', err);
    }
  }

  if (!html || html.length < 500) {
    throw new Error("Impossible de charger le contenu de l'album Google Photos. Vérifiez votre connexion.");
  }

  // 3. Extraction du titre de l'album
  let albumTitle = 'Photos de Famille';
  const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                     html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    albumTitle = titleMatch[1].replace(' - Google Photos', '').replace('Google Photos', '').trim();
    if (!albumTitle) albumTitle = 'Photos de Famille';
  }

  // 4. Extraction des URLs des photos haute résolution (lh3.googleusercontent.com/pw/...)
  const regex = /https:\/\/lh3\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]+/g;
  const matches = html.match(regex) || [];

  // Dédupliquer et filtrer les icônes/avatars système Google
  const uniqueUrls = Array.from(new Set(matches)).filter((url) => {
    return url.length > 60 && !url.includes('googleusercontent.com/og') && !url.includes('googleusercontent.com/a/');
  });

  if (uniqueUrls.length === 0) {
    throw new Error("Aucune photo trouvée dans cet album partagé. Assurez-vous que le lien de partage est bien valide.");
  }

  // 5. Servir les images via le proxy local d'image (ou direct si hors proxy)
  const photos = uniqueUrls.map((rawUrl, idx) => {
    const fullResUrl = `${rawUrl}=w1920-h1200-no`;
    return {
      id: `gp-${idx}-${Date.now()}`,
      url: `/api/image-proxy?url=${encodeURIComponent(fullResUrl)}`,
      rawUrl: fullResUrl,
      title: albumTitle,
      location: 'Google Photos',
      date: `Photo ${idx + 1}/${uniqueUrls.length}`,
    };
  });

  return {
    title: albumTitle,
    photos,
    count: photos.length,
    lastSynced: Date.now(),
  };
}
