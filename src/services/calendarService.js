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
      } else if (line.startsWith('RRULE:')) {
        currentEvent.rrule = line.substring(6).trim();
      } else if (line.startsWith('UID:')) {
        currentEvent.id = line.substring(4).trim();
      }
    }
  }

  if (rawEvents.length === 0) return [];

  // Développer les événements récurrents (RRULE) sur les 90 prochains jours
  const expandedEvents = expandRecurringEvents(rawEvents);

  return expandedEvents
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

// Développer les règles de récurrence iCal (RRULE) sur les 90 prochains jours
function expandRecurringEvents(events) {
  const now = new Date();
  const windowStartMs = now.getTime() - 24 * 3600 * 1000;
  const windowEndMs = now.getTime() + 90 * 24 * 3600 * 1000;

  const expanded = [];

  for (const ev of events) {
    if (!ev.rrule) {
      expanded.push(ev);
      continue;
    }

    const params = {};
    ev.rrule.split(';').forEach((part) => {
      const [k, v] = part.split('=');
      if (k && v) params[k.toUpperCase()] = v.toUpperCase();
    });

    const freq = params.FREQ;
    const startDate = new Date(ev.startDate);
    const baseTime = startDate.getTime();
    const durationMs = ev.endDate
      ? Math.max(0, new Date(ev.endDate).getTime() - baseTime)
      : 3600000;

    let until = Infinity;
    if (params.UNTIL) {
      until = parseIcsDate(params.UNTIL).getTime();
      if (until < windowStartMs) {
        // La récurrence est terminée dans le passé
        continue;
      }
    }

    if (params.COUNT) {
      const count = parseInt(params.COUNT, 10);
      const interval = params.INTERVAL ? parseInt(params.INTERVAL, 10) : 1;
      let estimatedEndMs = baseTime;
      if (freq === 'DAILY') estimatedEndMs += count * interval * 86400000;
      else if (freq === 'WEEKLY') estimatedEndMs += count * interval * 7 * 86400000;
      else if (freq === 'MONTHLY') estimatedEndMs += count * interval * 31 * 86400000;
      else if (freq === 'YEARLY') estimatedEndMs += count * interval * 366 * 86400000;

      if (estimatedEndMs < windowStartMs) {
        // La récurrence limitée (ex: COUNT=3) a expiré depuis longtemps dans le passé
        continue;
      }
    }

    const maxCount = params.COUNT ? parseInt(params.COUNT, 10) : 120;

    // Si l'événement d'origine est dans la fenêtre
    if (baseTime >= windowStartMs && baseTime <= windowEndMs && baseTime <= until) {
      expanded.push(ev);
    }

    if (freq === 'WEEKLY') {
      const daysMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
      const byDays = params.BYDAY
        ? params.BYDAY.split(',')
            .map((d) => daysMap[d.slice(-2)])
            .filter((d) => d !== undefined)
        : [startDate.getDay()];

      let cur = new Date(Math.max(baseTime, windowStartMs - 7 * 86400000));
      cur.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), 0);

      let count = 0;
      while (cur.getTime() <= windowEndMs && count < maxCount) {
        if (
          byDays.includes(cur.getDay()) &&
          cur.getTime() >= baseTime &&
          cur.getTime() <= until
        ) {
          if (cur.getTime() >= windowStartMs && cur.getTime() <= windowEndMs) {
            if (cur.getTime() !== baseTime) {
              expanded.push({
                ...ev,
                id: `${ev.id}-rec-${cur.getTime()}`,
                startDate: new Date(cur),
                endDate: new Date(cur.getTime() + durationMs),
              });
            }
            count++;
          }
        }
        cur = new Date(cur.getTime() + 86400000);
      }
    } else if (freq === 'DAILY') {
      const interval = params.INTERVAL ? parseInt(params.INTERVAL, 10) : 1;
      let cur = new Date(Math.max(baseTime, windowStartMs - 86400000));
      cur.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), 0);

      let count = 0;
      while (cur.getTime() <= windowEndMs && count < maxCount) {
        if (cur.getTime() >= baseTime && cur.getTime() <= until) {
          if (cur.getTime() >= windowStartMs && cur.getTime() <= windowEndMs) {
            if (cur.getTime() !== baseTime) {
              expanded.push({
                ...ev,
                id: `${ev.id}-rec-${cur.getTime()}`,
                startDate: new Date(cur),
                endDate: new Date(cur.getTime() + durationMs),
              });
            }
            count++;
          }
        }
        cur = new Date(cur.getTime() + interval * 86400000);
      }
    } else if (freq === 'MONTHLY') {
      const dayOfMonth = startDate.getDate();
      const curYear = now.getFullYear();
      for (let m = 0; m < 4; m++) {
        const targetDate = new Date(
          curYear,
          now.getMonth() + m,
          dayOfMonth,
          startDate.getHours(),
          startDate.getMinutes()
        );
        if (
          targetDate.getTime() >= windowStartMs &&
          targetDate.getTime() <= windowEndMs &&
          targetDate.getTime() <= until &&
          targetDate.getTime() >= baseTime
        ) {
          if (targetDate.getTime() !== baseTime) {
            expanded.push({
              ...ev,
              id: `${ev.id}-rec-${targetDate.getTime()}`,
              startDate: targetDate,
              endDate: new Date(targetDate.getTime() + durationMs),
            });
          }
        }
      }
    } else if (freq === 'YEARLY') {
      const curYear = now.getFullYear();
      for (const yr of [curYear, curYear + 1]) {
        const targetDate = new Date(
          yr,
          startDate.getMonth(),
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes()
        );
        if (
          targetDate.getTime() >= windowStartMs &&
          targetDate.getTime() <= windowEndMs &&
          targetDate.getTime() <= until &&
          targetDate.getTime() >= baseTime
        ) {
          if (targetDate.getTime() !== baseTime) {
            expanded.push({
              ...ev,
              id: `${ev.id}-rec-${targetDate.getTime()}`,
              startDate: targetDate,
              endDate: new Date(targetDate.getTime() + durationMs),
            });
          }
        }
      }
    } else {
      expanded.push(ev);
    }
  }

  return expanded.length > 0 ? expanded : events;
}

export const CALENDAR_COLOR_PRESETS = [
  { label: 'Bleu ciel', value: '#38bdf8' },
  { label: 'Vert émeraude', value: '#34d399' },
  { label: 'Rose framboise', value: '#fb7185' },
  { label: 'Ambre / Jaune', value: '#fbbf24' },
  { label: 'Violet pastel', value: '#c084fc' },
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Orange vif', value: '#fb923c' },
  { label: 'Cyan lagon', value: '#22d3ee' },
];

// Fetch multiple calendars concurrently and merge events
export async function fetchMultipleCalendars(calendars = []) {
  const activeCalendars = (calendars || []).filter(
    (c) => c && c.enabled !== false && c.url && c.url.trim()
  );
  if (activeCalendars.length === 0) return [];

  const promises = activeCalendars.map(async (cal) => {
    let cleanUrl = cal.url.trim();
    if (cleanUrl.startsWith('webcal://')) {
      cleanUrl = cleanUrl.replace('webcal://', 'https://');
    }
    try {
      const res = await fetch(`/api/fetch-calendar?url=${encodeURIComponent(cleanUrl)}&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const icsText = await res.text();
      const events = parseIcsCalendar(icsText);
      return events.map((ev) => ({
        ...ev,
        calendarId: cal.id,
        calendarName: cal.name || 'Agenda',
        calendarColor: cal.color || '#38bdf8',
      }));
    } catch (err) {
      console.warn(`Erreur lors de la synchronisation de l'agenda "${cal.name}":`, err);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allEvents = results.flat();
  return allEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

// Fetch calendar from URL (rétrocompatibilité)
export async function fetchCalendarFromUrl(calendarUrl, calMeta = {}) {
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
    return events.map((ev) => ({
      ...ev,
      calendarId: calMeta.id || 'default',
      calendarName: calMeta.name || 'Agenda',
      calendarColor: calMeta.color || '#38bdf8',
    }));
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

