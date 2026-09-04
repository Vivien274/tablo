// Gestionnaire de stockage local (LocalStorage) pour Tablo

export const INITIAL_MEMBERS = [
  { id: 'all', name: 'Tous', color: 'bg-zinc-700 text-zinc-100', dot: '#a1a1aa', emoji: '🏠' },
  { id: 'papa', name: 'Papa', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', dot: '#38bdf8', emoji: '🧔‍♂️' },
  { id: 'maman', name: 'Maman', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dot: '#fb7185', emoji: '👩' },
  { id: 'william', name: 'William', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: '#34d399', emoji: '👦' },
];

export const INITIAL_TODOS = [
  {
    id: '1',
    title: 'Acheter pain, fruits & lait d\'avoine',
    category: 'Courses',
    assignee: 'papa',
    completed: false,
    priority: 'high',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: '2',
    title: 'Sortir le bac de recyclage ce soir (bac jaune)',
    category: 'Maison',
    assignee: 'william',
    completed: false,
    priority: 'medium',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: '3',
    title: 'Signer l\'autorisation de sortie scolaire',
    category: 'École',
    assignee: 'maman',
    completed: true,
    priority: 'high',
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: '4',
    title: 'Préparer les affaires de sport',
    category: 'École',
    assignee: 'william',
    completed: false,
    priority: 'low',
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: '5',
    title: 'Arroser les plantes du salon et du balcon',
    category: 'Maison',
    assignee: 'all',
    completed: false,
    priority: 'low',
    createdAt: Date.now() - 3600000 * 6,
  },
];

export const INITIAL_PHOTOS = [
  {
    id: 'gp-0',
    url: 'https://lh3.googleusercontent.com/pw/AP1GczMgxfxk3-0mQITJ9AUJIIcTaDvnpqjijF1ZOGeN_maWGokoJS7MXdKGVMI6PfFR8BW6rMTLTmIDY9dZW5IIeCjwVRe0zd1I7dyAlDLhmJV8-NRakJww=w1920-h1200-no',
    title: 'Souvenir de Famille',
    location: 'Google Photos',
    date: 'Album Partagé',
  },
  {
    id: 'gp-1',
    url: 'https://lh3.googleusercontent.com/pw/AP1GczN2gz23wowm37hYLbsk9vrBoo5PntpNZgxo7F0s5zPNIHut8SSycev1c9fjYl7tPe1eI7eJ78cKIO2boAmWvkJl7WKjWZPTVYG0ejVCrRMQUH8pTk_J=w1920-h1200-no',
    title: 'Souvenir de Famille',
    location: 'Google Photos',
    date: 'Album Partagé',
  },
  {
    id: 'gp-2',
    url: 'https://lh3.googleusercontent.com/pw/AP1GczOpBvOHfy32oeHB3no4wlkwdar4mUHYcsUvPVr-l_au5ib9wj35oMNKKW-Mhd2GqdgQbRMVLFQBAyhfAfD0vxSQ8pyBImkTxgFtOByro3ACRtTom12u=w1920-h1200-no',
    title: 'Souvenir de Famille',
    location: 'Google Photos',
    date: 'Album Partagé',
  },
  {
    id: 'gp-3',
    url: 'https://lh3.googleusercontent.com/pw/AP1GczMyMa7H31jbIDGsCoiU1QFVI_iyB0UAaMcyYculnuiKpET3BetgJ0w3AFk-xIfHxWefkJmywc8Q-3cgvfck-jVE0ioaTh7PE_8M513tzAMcJVujmQ20=w1920-h1200-no',
    title: 'Souvenir de Famille',
    location: 'Google Photos',
    date: 'Album Partagé',
  },
  {
    id: 'gp-4',
    url: 'https://lh3.googleusercontent.com/pw/AP1GczPsRzA3WoE_I1Q3kX6LfTbqi55ewhwFHL_ITDpefD8iatdCugwant4itAeHbZe8eCwV8g0jPGxbt2wE7WDCFQ6v8R54ixwLa3xZSQagZrjmajDgFSM4=w1920-h1200-no',
    title: 'Souvenir de Famille',
    location: 'Google Photos',
    date: 'Album Partagé',
  },
];

export const DEFAULT_CALENDARS = [
  {
    id: 'cal-vivien',
    name: 'Vivien',
    color: '#38bdf8',
    url: 'https://calendar.google.com/calendar/ical/vivien274%40gmail.com/private-72f1bfe6d142f4988834d66bd8edc7fc/basic.ics',
    enabled: true,
  },
];

const KEYS = {
  TODOS: 'tablo_todos_v2',
  MEMBERS: 'tablo_members_v2',
  PHOTOS: 'tablo_photos',
  NOTES: 'tablo_notes',
  CITY: 'tablo_city',
  GP_ALBUM: 'tablo_gp_album_url',
  CALENDARS: 'tablo_calendars',
  CAL_WEBHOOK: 'tablo_cal_webhook',
};

export const storage = {
  // Synchronisation centralisée avec le serveur local (/api/config)
  fetchServerConfig: async () => {
    try {
      let res = await fetch(`/api/config?_t=${Date.now()}`);
      if (!res.ok) {
        // Fallback statique pour version déployée (Vercel, Netlify, GitHub Pages, etc.)
        res = await fetch(`/tablo-config.json?_t=${Date.now()}`);
      }
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      if (data) {
        if (data.calendars) storage.setCalendars(data.calendars, false);
        if (data.calendarWebhookUrl !== undefined) storage.setCalendarWebhookUrl(data.calendarWebhookUrl, false);
        if (data.googleAlbumUrl) storage.setGoogleAlbumUrl(data.googleAlbumUrl, false);
        if (data.city) storage.setCity(data.city, false);
        return data;
      }
    } catch (e) {
      console.warn('Central config fetch fallback to localStorage:', e);
    }
    return null;
  },

  saveServerConfig: async (updates) => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn('Could not persist to server config:', e);
    }
  },

  getTodos: () => {
    try {
      const data = localStorage.getItem(KEYS.TODOS);
      return data ? JSON.parse(data) : INITIAL_TODOS;
    } catch {
      return INITIAL_TODOS;
    }
  },
  setTodos: (todos) => {
    try {
      localStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
    } catch (e) {
      console.error(e);
    }
  },
  getMembers: () => {
    try {
      const data = localStorage.getItem(KEYS.MEMBERS);
      return data ? JSON.parse(data) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  },
  setMembers: (members) => {
    try {
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error(e);
    }
  },
  getPhotos: () => {
    try {
      const data = localStorage.getItem(KEYS.PHOTOS);
      return data ? JSON.parse(data) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  },
  setPhotos: (photos) => {
    try {
      localStorage.setItem(KEYS.PHOTOS, JSON.stringify(photos));
    } catch (e) {
      console.error(e);
    }
  },
  getGoogleAlbumUrl: () => {
    try {
      return localStorage.getItem(KEYS.GP_ALBUM) || 'https://photos.app.goo.gl/jDck5X2YPCZ99N868';
    } catch {
      return 'https://photos.app.goo.gl/jDck5X2YPCZ99N868';
    }
  },
  setGoogleAlbumUrl: (url, syncToServer = true) => {
    try {
      localStorage.setItem(KEYS.GP_ALBUM, url);
      if (syncToServer) {
        storage.saveServerConfig({ googleAlbumUrl: url });
      }
    } catch (e) {
      console.error(e);
    }
  },

  // Multi-calendriers
  getCalendars: () => {
    try {
      const data = localStorage.getItem(KEYS.CALENDARS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const legacyUrl = localStorage.getItem('tablo_cal_url');
      if (legacyUrl) {
        return [
          {
            id: 'cal-legacy',
            name: 'Vivien',
            color: '#38bdf8',
            url: legacyUrl,
            enabled: true,
          },
        ];
      }
      return DEFAULT_CALENDARS;
    } catch {
      return DEFAULT_CALENDARS;
    }
  },
  setCalendars: (calendars, syncToServer = true) => {
    try {
      localStorage.setItem(KEYS.CALENDARS, JSON.stringify(calendars));
      if (syncToServer) {
        storage.saveServerConfig({ calendars });
      }
    } catch (e) {
      console.error(e);
    }
  },

  // Rétrocompatibilité URL unique
  getCalendarUrl: () => {
    const calendars = storage.getCalendars();
    return calendars?.[0]?.url || '';
  },
  setCalendarUrl: (url) => {
    const calendars = storage.getCalendars();
    if (calendars.length > 0) {
      const updated = calendars.map((c, i) => (i === 0 ? { ...c, url } : c));
      storage.setCalendars(updated);
    } else {
      storage.setCalendars([
        {
          id: 'cal-1',
          name: 'Principal',
          color: '#38bdf8',
          url,
          enabled: true,
        },
      ]);
    }
  },

  getCalendarWebhookUrl: () => {
    try {
      return localStorage.getItem(KEYS.CAL_WEBHOOK) || '';
    } catch {
      return '';
    }
  },
  setCalendarWebhookUrl: (url, syncToServer = true) => {
    try {
      localStorage.setItem(KEYS.CAL_WEBHOOK, url);
      if (syncToServer) {
        storage.saveServerConfig({ calendarWebhookUrl: url });
      }
    } catch (e) {
      console.error(e);
    }
  },

  getCustomCalendarEvents: () => {
    try {
      const data = localStorage.getItem('tablo_custom_cal_events');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setCustomCalendarEvents: (events) => {
    try {
      localStorage.setItem('tablo_custom_cal_events', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  },
  addCustomCalendarEvent: (event) => {
    try {
      const existing = storage.getCustomCalendarEvents();
      const updated = [event, ...existing.filter((e) => e.id !== event.id)];
      storage.setCustomCalendarEvents(updated);
      return updated;
    } catch {
      return [event];
    }
  },
  getCity: () => {
    try {
      const data = localStorage.getItem(KEYS.CITY);
      return data ? JSON.parse(data) : { name: 'Comines', label: 'Comines (Nord)', lat: 50.7608, lon: 3.0075 };
    } catch {
      return { name: 'Comines', label: 'Comines (Nord)', lat: 50.7608, lon: 3.0075 };
    }
  },
  setCity: (city, syncToServer = true) => {
    try {
      localStorage.setItem(KEYS.CITY, JSON.stringify(city));
      if (syncToServer) {
        storage.saveServerConfig({ city });
      }
    } catch (e) {
      console.error(e);
    }
  },
};
