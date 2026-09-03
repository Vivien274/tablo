import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  RefreshCw,
  Link,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Clock,
  Plus,
  Copy,
  Sparkles,
  Send,
  ExternalLink,
} from 'lucide-react';
import { fetchCalendarFromUrl, createGoogleCalendarEvent } from '../services/calendarService';
import { playSuccessChime } from '../utils/audio';

const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var cal = CalendarApp.getDefaultCalendar();
    
    var start = new Date(data.startTime);
    var end = data.endTime ? new Date(data.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    
    var event;
    if (data.allDay) {
      event = cal.createAllDayEvent(data.title, start, {
        location: data.location || ''
      });
    } else {
      event = cal.createEvent(data.title, start, end, {
        location: data.location || ''
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      id: event.getId(),
      title: event.getTitle()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function CalendarWidget({
  calendarEvents = [],
  calendarUrl = '',
  onUpdateCalendarUrl,
  calendarWebhookUrl = '',
  onUpdateCalendarWebhookUrl,
  onRefreshCalendar,
  onAddLocalEvent,
}) {
  // Sync Modal State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('sync'); // 'sync' | 'webhook'
  const [inputCalUrl, setInputCalUrl] = useState(calendarUrl || '');
  const [inputWebhookUrl, setInputWebhookUrl] = useState(calendarWebhookUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [calSuccessMsg, setCalSuccessMsg] = useState(null);
  const [calErrorMsg, setCalErrorMsg] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Add Event Modal State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newAllDay, setNewAllDay] = useState(false);
  const [newStartTime, setNewStartTime] = useState(() => {
    const nextHour = (new Date().getHours() + 1) % 24;
    return `${String(nextHour).padStart(2, '0')}:00`;
  });
  const [newEndTime, setNewEndTime] = useState(() => {
    const endHour = (new Date().getHours() + 2) % 24;
    return `${String(endHour).padStart(2, '0')}:00`;
  });
  const [newLocation, setNewLocation] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [addEventError, setAddEventError] = useState(null);
  const [addEventSuccess, setAddEventSuccess] = useState(false);

  // Copy Google Apps Script code to clipboard
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    });
  };

  // Save calendar URLs (iCal & Webhook)
  const handleSaveCalendarSettings = async (e) => {
    e.preventDefault();
    setCalErrorMsg(null);
    setCalSuccessMsg(null);
    setIsSyncing(true);

    try {
      if (inputCalUrl.trim() !== calendarUrl && onUpdateCalendarUrl) {
        onUpdateCalendarUrl(inputCalUrl.trim());
      }
      if (onUpdateCalendarWebhookUrl) {
        onUpdateCalendarWebhookUrl(inputWebhookUrl.trim());
      }

      if (inputCalUrl.trim()) {
        const events = await fetchCalendarFromUrl(inputCalUrl.trim());
        setCalSuccessMsg(`Synchronisé avec succès ! (${events.length} événement(s) récupéré(s))`);
      } else {
        setCalSuccessMsg('Paramètres enregistrés !');
      }

      setTimeout(() => {
        setIsCalendarModalOpen(false);
        setCalSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setCalErrorMsg(
        err.message ||
          "Impossible de charger ce calendrier. Vérifiez l'URL de votre flux iCal."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Add event and sync to Google Calendar
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAddingEvent(true);
    setAddEventError(null);

    try {
      let startIso;
      let endIso;

      if (newAllDay) {
        startIso = `${newDate}T00:00:00`;
        endIso = `${newDate}T23:59:59`;
      } else {
        startIso = `${newDate}T${newStartTime}:00`;
        endIso = `${newDate}T${newEndTime}:00`;
      }

      const eventPayload = {
        title: newTitle.trim(),
        startTime: startIso,
        endTime: endIso,
        allDay: newAllDay,
        location: newLocation.trim(),
      };

      // Si le Webhook Google Apps Script est configuré, on synchronise avec Google
      if (calendarWebhookUrl && calendarWebhookUrl.trim()) {
        await createGoogleCalendarEvent(calendarWebhookUrl.trim(), eventPayload);
      }

      // Ajout optimiste local persistant pour affichage immédiat
      const localEvent = {
        id: `custom-${Date.now()}`,
        title: newTitle.trim(),
        startDate: new Date(startIso).toISOString(),
        endDate: new Date(endIso).toISOString(),
        allDay: newAllDay,
        location: newLocation.trim(),
        member: 'all',
      };

      if (onAddLocalEvent) {
        onAddLocalEvent(localEvent);
      }

      playSuccessChime();
      setAddEventSuccess(true);

      setTimeout(() => {
        setIsAddEventModalOpen(false);
        setAddEventSuccess(false);
        setNewTitle('');
        setNewLocation('');
      }, 1200);
    } catch (err) {
      setAddEventError(err.message || "Erreur lors de l'enregistrement de l'événement.");
    } finally {
      setIsAddingEvent(false);
    }
  };

  // Événements à venir uniquement (aujourd'hui et plus tard)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const sortedCalendarEvents = [...calendarEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const upcomingEvents = sortedCalendarEvents.filter((ev) => {
    const endOrStart = ev.endDate ? new Date(ev.endDate).getTime() : new Date(ev.startDate).getTime();
    return endOrStart >= todayStartMs;
  });

  const formatEventDisplay = (startDate, endDate, allDay) => {
    if (!startDate) return { dateStr: '', timeStr: '' };
    const start = new Date(startDate);
    const now = new Date();

    const isToday =
      start.getDate() === now.getDate() &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      start.getDate() === tomorrow.getDate() &&
      start.getMonth() === tomorrow.getMonth() &&
      start.getFullYear() === tomorrow.getFullYear();

    let dateStr = '';
    if (isToday) {
      dateStr = "Aujourd'hui";
    } else if (isTomorrow) {
      dateStr = 'Demain';
    } else {
      dateStr = start.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    if (allDay) {
      return { dateStr, timeStr: 'Journée' };
    }

    const timeStr = `${String(start.getHours()).padStart(2, '0')}h${String(start.getMinutes()).padStart(2, '0')}`;
    return { dateStr, timeStr };
  };

  return (
    <>
      <div className="bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group w-full">
        {/* Top Header : Titre + Bouton Ajouter + Bouton Sync */}
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Agenda familial
              </h3>
            </div>

            {/* Actions : Ajouter un rendez-vous + Synchroniser */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all touch-press"
                title="Ajouter un événement à Google Calendar"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ajouter</span>
              </button>

              <button
                onClick={() => setIsCalendarModalOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-sky-500/15 hover:text-sky-300 border border-white/15 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 touch-press"
                title="Paramètres de synchronisation Google Calendar"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des événements à venir */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 min-h-[140px]">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-30 text-sky-400" />
              <p className="text-sm font-medium text-zinc-400">Aucun rendez-vous à venir</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Cliquez sur « Ajouter » pour créer un événement
              </p>
            </div>
          ) : (
            upcomingEvents.map((ev) => {
              const { dateStr, timeStr } = formatEventDisplay(ev.startDate, ev.endDate, ev.allDay);

              return (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-between gap-3 shadow-sm hover:bg-white/[0.07] transition-colors"
                >
                  {/* Heure & Titre */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col items-center justify-center text-xs font-mono-numbers font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 rounded-xl shrink-0 leading-tight">
                      <span className="text-[10px] uppercase font-semibold text-sky-400">{dateStr}</span>
                      <span className="text-white text-xs">{timeStr}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">
                        {ev.title}
                      </h4>
                      {ev.location && (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Tactile : Ajouter un rendez-vous (Google Calendar Sync) */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card bg-zinc-900/98 border-white/20 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-white">Nouveau rendez-vous</h3>
              </div>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!calendarWebhookUrl && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-2">
                <span>Synchronisation Google Calendar non configurée</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEventModalOpen(false);
                    setModalActiveTab('webhook');
                    setIsCalendarModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold underline text-[11px]"
                >
                  Configurer
                </button>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Titre de l'événement</label>
                <input
                  type="text"
                  placeholder="Ex: Rendez-vous médecin, Dîner famille..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block font-medium">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                    required
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer touch-press">
                    <input
                      type="checkbox"
                      checked={newAllDay}
                      onChange={(e) => setNewAllDay(e.target.checked)}
                      className="rounded border-white/20 text-sky-500 focus:ring-sky-400 w-4 h-4 bg-black/50"
                    />
                    <span className="text-xs text-zinc-200 font-medium">Toute la journée</span>
                  </label>
                </div>
              </div>

              {!newAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block font-medium">Début</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block font-medium">Fin</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-400 mb-1 block font-medium">Lieu (optionnel)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: 12 rue de la Paix, Paris..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {addEventError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{addEventError}</span>
                </div>
              )}

              {addEventSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Événement synchronisé avec succès !</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingEvent}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs sm:text-sm hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingEvent ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synchronisation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajouter le rendez-vous</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tactile : Configuration iCal & Webhook Google */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card bg-zinc-900/98 border-white/20 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Connexion Google Calendar</h3>
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Onglets Lecture vs Écriture */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 gap-1">
              <button
                type="button"
                onClick={() => setModalActiveTab('sync')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalActiveTab === 'sync'
                    ? 'bg-sky-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>1. Lecture (Flux iCal)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('webhook')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalActiveTab === 'webhook'
                    ? 'bg-sky-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Ajout (Webhook Google)</span>
              </button>
            </div>

            <form onSubmit={handleSaveCalendarSettings} className="space-y-4">
              {/* ONGLET 1 : LECTURE ICAL */}
              {modalActiveTab === 'sync' && (
                <>
                  <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-2 leading-relaxed border border-sky-500/20 bg-sky-950/20">
                    <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>Comment obtenir le bon lien Google Calendar :</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] sm:text-xs">
                      <li>Ouvrez <strong>Google Calendar</strong> sur ordinateur.</li>
                      <li>Cliquez sur les <strong>3 petits points</strong> à côté de votre agenda &gt; <strong>Paramètres</strong>.</li>
                      <li>Descendez jusqu'à la section <strong>« Intégrer l'agenda »</strong>.</li>
                      <li>Copiez le lien <strong>« Adresse secrète au format iCal »</strong> <em>(qui contient <code>/private-.../basic.ics</code>)</em>.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block font-medium">
                      Lien Adresse secrète iCal (Google ou iCloud)
                    </label>
                    <div className="relative">
                      <Link className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
                        value={inputCalUrl}
                        onChange={(e) => setInputCalUrl(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ONGLET 2 : ÉCRITURE WEBHOOK GOOGLE */}
              {modalActiveTab === 'webhook' && (
                <div className="space-y-3.5">
                  <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-2 leading-relaxed border border-amber-500/20 bg-amber-950/20">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Activer l'ajout direct sur Google Agenda en 2 minutes :</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] sm:text-xs">
                      <li>
                        Ouvrez{' '}
                        <a
                          href="https://script.google.com/home/start"
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-300 underline font-semibold inline-flex items-center gap-0.5"
                        >
                          script.google.com <ExternalLink className="w-3 h-3 inline" />
                        </a>{' '}
                        et cliquez sur <strong>Nouveau projet</strong>.
                      </li>
                      <li>Collez le code ci-dessous à la place du texte existant.</li>
                      <li>
                        Cliquez en haut à droite sur <strong>Déployer &gt; Nouveau déploiement</strong>.
                      </li>
                      <li>
                        Sélectionnez type <strong>Application Web</strong>, choisissez <em>« Exécuter en tant que : Moi »</em> et <em>« Qui a accès : Tout le monde »</em>.
                      </li>
                      <li>Collez l'URL de l'application Web obtenue dans le champ ci-dessous.</li>
                    </ol>
                  </div>

                  {/* Bouton Copier le script */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-zinc-400 font-medium">Script Google officiel à copier :</span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 text-xs font-semibold flex items-center gap-1 transition-all touch-press"
                      >
                        {copiedScript ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier le script</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono-numbers text-zinc-300 max-h-24 overflow-y-auto select-all">
                      {GOOGLE_APPS_SCRIPT_CODE}
                    </pre>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block font-medium">
                      URL de l'application Web Google Apps Script
                    </label>
                    <div className="relative">
                      <Link className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={inputWebhookUrl}
                        onChange={(e) => setInputWebhookUrl(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {calErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{calErrorMsg}</span>
                </div>
              )}

              {calSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{calSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <span>Enregistrer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
