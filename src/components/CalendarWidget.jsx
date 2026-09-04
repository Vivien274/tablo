import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  RefreshCw,
  Plus,
  Send,
  X,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react';
import { createGoogleCalendarEvent } from '../services/calendarService';
import { playSuccessChime } from '../utils/audio';

export default function CalendarWidget({
  calendarEvents = [],
  calendars = [],
  calendarWebhookUrl = '',
  onRefreshCalendar,
  onAddLocalEvent,
  onOpenSettings,
}) {
  // Add Event Modal State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedCalId, setSelectedCalId] = useState('');
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

  // Initialiser l'agenda cible par défaut quand le modal d'ajout s'ouvre
  useEffect(() => {
    if (isAddEventModalOpen && calendars && calendars.length > 0) {
      const firstActive = calendars.find((c) => c.enabled) || calendars[0];
      setSelectedCalId(firstActive.id);
    }
  }, [isAddEventModalOpen, calendars]);

  // Handle Add Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    setIsAddingEvent(true);
    setAddEventError(null);
    setAddEventSuccess(false);

    try {
      let startIso = '';
      let endIso = '';

      if (newAllDay) {
        startIso = `${newDate}T00:00:00`;
        endIso = `${newDate}T23:59:59`;
      } else {
        startIso = `${newDate}T${newStartTime || '09:00'}:00`;
        endIso = `${newDate}T${newEndTime || '10:00'}:00`;
      }

      const selectedCal = calendars.find((c) => c.id === selectedCalId) || calendars[0];
      const targetCalName = selectedCal ? selectedCal.name : 'Famille';
      const targetCalColor = selectedCal ? selectedCal.color : '#38bdf8';

      // 1. Essai Webhook Google Apps Script si configuré
      if (calendarWebhookUrl) {
        const payload = {
          title: newTitle.trim(),
          startTime: startIso,
          endTime: endIso,
          allDay: newAllDay,
          location: newLocation.trim(),
          calendarName: targetCalName,
        };

        const result = await createGoogleCalendarEvent(calendarWebhookUrl, payload);
        if (!result.success) {
          throw new Error(result.error || "Échec d'envoi à Google Calendar");
        }
      }

      // 2. Ajout immédiat en local pour affichage instantané
      const localEvent = {
        id: `local-${Date.now()}`,
        title: newTitle.trim(),
        startDate: startIso,
        endDate: endIso,
        allDay: newAllDay,
        location: newLocation.trim(),
        calendarName: targetCalName,
        calendarColor: targetCalColor,
        isCustom: true,
      };

      if (onAddLocalEvent) {
        onAddLocalEvent(localEvent);
      }

      playSuccessChime();
      setAddEventSuccess(true);

      setTimeout(() => {
        setIsAddEventModalOpen(false);
        setNewTitle('');
        setNewLocation('');
        setAddEventSuccess(false);
        if (onRefreshCalendar) onRefreshCalendar();
      }, 1000);
    } catch (err) {
      setAddEventError(err.message || "Erreur lors de l'ajout du rendez-vous.");
    } finally {
      setIsAddingEvent(false);
    }
  };

  // Filtrer les événements à venir (à partir d'aujourd'hui 00:00:00)
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
      return { dateStr, timeStr: 'Journée entière' };
    }

    const timeStr = `${String(start.getHours()).padStart(2, '0')}h${String(start.getMinutes()).padStart(2, '0')}`;
    return { dateStr, timeStr };
  };

  return (
    <>
      <div className="bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group w-full">
        {/* Top Header épuré : Titre complet à gauche + Bouton Ajouter à droite */}
        <div className="shrink-0 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Agenda familial
              </h3>
            </div>

            {/* Bouton Ajouter un événement */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all touch-press"
                title="Ajouter un événement"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste aérée et raffinée des événements */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 min-h-[140px]">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <CalendarIcon className="w-10 h-10 mb-2.5 opacity-30 text-sky-400" />
              <p className="text-sm font-medium text-zinc-400">Aucun rendez-vous à venir</p>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-xs text-sky-400 hover:text-sky-300 mt-2 underline underline-offset-4 touch-press"
                >
                  Configurer les agendas dans les Paramètres ⚙️
                </button>
              )}
            </div>
          ) : (
            upcomingEvents.map((ev) => {
              const { dateStr, timeStr } = formatEventDisplay(ev.startDate, ev.endDate, ev.allDay);
              const calColor = ev.calendarColor || '#38bdf8';
              const calName = ev.calendarName;

              return (
                <div
                  key={ev.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between gap-3 shadow-sm transition-all"
                >
                  {/* Accent vertical avec couleur de l'agenda */}
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: calColor }}
                  />

                  {/* Date & Heure */}
                  <div className="flex flex-col shrink-0 min-w-[85px]">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: calColor }}
                    >
                      {dateStr}
                    </span>
                    <span className="text-xs font-mono-numbers text-zinc-300 font-medium">
                      {timeStr}
                    </span>
                  </div>

                  {/* Titre & Lieu */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate tracking-tight">
                      {ev.title}
                    </h4>
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Pastille discrète du calendrier source à droite */}
                  {calName && (
                    <div
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                      style={{
                        backgroundColor: `${calColor}15`,
                        borderColor: `${calColor}30`,
                        color: calColor,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: calColor }}
                      />
                      <span className="truncate max-w-[90px]">{calName}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Tactile : Ajouter un rendez-vous */}
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

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              {/* Choix de l'agenda */}
              {calendars && calendars.length > 1 && (
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block font-medium">Agenda cible</label>
                  <select
                    value={selectedCalId}
                    onChange={(e) => setSelectedCalId(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id} className="bg-zinc-900 text-white">
                        {cal.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block font-medium">Titre du rendez-vous</label>
                <input
                  type="text"
                  placeholder="Ex: Médecin, Anniversaire, Réunion..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 placeholder-zinc-600"
                  required
                />
              </div>

              {/* Date */}
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

              {/* Toute la journée */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDayCheck"
                  checked={newAllDay}
                  onChange={(e) => setNewAllDay(e.target.checked)}
                  className="rounded bg-black/50 border-white/20 text-sky-500 focus:ring-sky-400 h-4 w-4"
                />
                <label htmlFor="allDayCheck" className="text-xs text-zinc-300 select-none">
                  Toute la journée
                </label>
              </div>

              {/* Heures début / fin */}
              {!newAllDay && (
                <div className="grid grid-cols-2 gap-2">
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

              {/* Lieu */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block font-medium">Lieu (optionnel)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: 12 rue de la Paix, Comines..."
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
                  <span>Événement ajouté avec succès !</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm text-zinc-400 hover:text-white"
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
                      <span>Ajout en cours...</span>
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
    </>
  );
}
