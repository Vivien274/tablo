// Service de gestion et synchronisation des calendriers familiaux (Google Calendar, iCloud, Outlook)

export const DEFAULT_CALENDAR_EVENTS = [];

// Parser iCal / ICS
export function parseIcsCalendar(icsContent) {
  if (!icsContent || typeof icsContent !== 'string') return [];

  // Vérifier si le retour est une page d'erreur HTML au lieu d'un fichier iCal
  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    if (icsContent.includes('<html') || icsContent.includes('Error 404')) {
      throw new Error('404_NOT_FOUND');
    }
    return [];
  }

  const lines = icsContent.split(/\r\n|\n|\r/);
  const rawEvents = [];
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Concaténer les lignes multilignes pliées (RFC 5545)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].substring(1);
      i++;
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.title && currentEvent.startDate) {
        rawEvents.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = cleanIcsText(line.substring(8).trim());
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = cleanIcsText(line.substring(9).trim());
      } else if (line.startsWith('DTSTART')) {
        const value = line.split(':').pop();
        currentEvent.startDate = parseIcsDate(value);
        currentEvent.allDay = value.length === 8;
      } else if (line.startsWith('DTEND')) {
        const value = line.split(':').pop();
        currentEvent.endDate = parseIcsDate(value);
      } else if (line.startsWith('UID:')) {
        currentEvent.id = line.substring(4).trim();
      }
    }
  }

  if (rawEvents.length === 0) return [];

  return rawEvents
    .map((ev, idx) => {
      const titleLower = (ev.title || '').toLowerCase();
      let member = 'all';
      if (
        titleLower.includes('william') ||
        titleLower.includes('judo') ||
        titleLower.includes('école') ||
        titleLower.includes('sport') ||
        titleLower.includes('basket') ||
        titleLower.includes('toy story')
      ) {
        member = 'william';
      } else if (
        titleLower.includes('vivien') ||
        titleLower.includes('papa') ||
        titleLower.includes('contrôle technique') ||
        titleLower.includes('spoolio') ||
        titleLower.includes('polo')
      ) {
        member = 'papa';
      } else if (
        titleLower.includes('maman') ||
        titleLower.includes('dentiste') ||
        titleLower.includes('docteur') ||
        titleLower.includes('bihouée') ||
        titleLower.includes('brahic')
      ) {
        member = 'maman';
      }

      return {
        id: ev.id || `ics-${idx}-${Date.now()}`,
        title: ev.title || 'Événement',
        member,
        startDate: ev.startDate || new Date(),
        endDate: ev.endDate || ev.startDate || new Date(),
        location: ev.location || '',
        allDay: !!ev.allDay,
      };
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function cleanIcsText(str) {
  if (!str) return '';
  return str
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\n/g, ' ')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseIcsDate(dateStr) {
  if (!dateStr) return new Date();
  // YYYYMMDD
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  }
  // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [, y, m, d, h, min, s] = match.map(Number);
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(y, m - 1, d, h, min, s));
    }
    return new Date(y, m - 1, d, h, min, s);
  }
  return new Date(dateStr);
}

// Fetch calendar from URL
export async function fetchCalendarFromUrl(calendarUrl) {
  if (!calendarUrl || !calendarUrl.trim()) {
    return [];
  }

  let cleanUrl = calendarUrl.trim();
  if (cleanUrl.startsWith('webcal://')) {
    cleanUrl = cleanUrl.replace('webcal://', 'https://');
  }

  try {
    const res = await fetch(`/api/fetch-calendar?url=${encodeURIComponent(cleanUrl)}&_t=${Date.now()}`);
    if (!res.ok) throw new Error('Erreur de téléchargement du calendrier');
    const icsText = await res.text();
    const events = parseIcsCalendar(icsText);
    return events;
  } catch (err) {
    if (err.message === '404_NOT_FOUND' || (err.message && err.message.includes('404'))) {
      throw new Error("L'agenda Google renvoie une erreur 404. Veuillez utiliser l'Adresse secrète au format iCal.");
    }
    console.warn('Calendar sync error:', err);
    return [];
  }
}

// Créer un événement dans Google Calendar via Webhook Google Apps Script
export async function createGoogleCalendarEvent(webhookUrl, eventData) {
  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error("L'URL du Webhook Google Calendar n'est pas configurée. Rendez-vous dans 'Synchroniser' pour l'ajouter.");
  }

  const cleanUrl = webhookUrl.trim();
  const payload = {
    title: eventData.title,
    startTime: eventData.startTime, // ISO string
    endTime: eventData.endTime,     // ISO string
    allDay: !!eventData.allDay,
    location: eventData.location || '',
  };

  try {
    // Essai via le proxy Vite local pour éviter tout problème CORS
    const proxyRes = await fetch('/api/create-calendar-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: cleanUrl, event: payload }),
    });
    if (proxyRes.ok) {
      return await proxyRes.json();
    }
  } catch (e) {
    console.debug('Proxy creation fallback:', e);
  }

  // Fallback direct vers Google Apps Script Web App avec mode no-cors
  await fetch(cleanUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return { status: 'success' };
}

