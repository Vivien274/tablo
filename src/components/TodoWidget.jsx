import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ListTodo,
  CheckCheck,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  RefreshCw,
  Link,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';
import { fetchCalendarFromUrl } from '../services/calendarService';

export default function TodoWidget({
  todos,
  onUpdateTodos,
  members,
  calendarEvents = [],
  calendarUrl = '',
  onUpdateCalendarUrl,
}) {
  const [activeView, setActiveView] = useState('todos'); // 'todos' | 'agenda'
  const [selectedMember, setSelectedMember] = useState('all');

  // Todo Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('all');

  // Calendar Sync Modal State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [inputCalUrl, setInputCalUrl] = useState(calendarUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [calSuccessMsg, setCalSuccessMsg] = useState(null);
  const [calErrorMsg, setCalErrorMsg] = useState(null);

  // Toggle todo with tactile chime & confetti
  const handleToggle = (id) => {
    const nextTodos = todos.map((t) => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          playSuccessChime();
          try {
            confetti({
              particleCount: 30,
              spread: 65,
              origin: { y: 0.7 },
              colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
              disableForReducedMotion: true,
            });
          } catch {
            // ignore
          }
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    onUpdateTodos(nextTodos);
  };

  // Add todo
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      assignee: newAssignee,
      category: 'Maison',
      completed: false,
      priority: 'medium',
      createdAt: Date.now(),
    };

    onUpdateTodos([newItem, ...todos]);
    setNewTitle('');
    setNewAssignee('all');
    setIsAddModalOpen(false);
  };

  // Delete todo
  const handleDelete = (id, e) => {
    e?.stopPropagation();
    onUpdateTodos(todos.filter((t) => t.id !== id));
  };

  // Clear completed
  const handleClearCompleted = () => {
    onUpdateTodos(todos.filter((t) => !t.completed));
  };

  // Save calendar URL
  const handleSaveCalendarUrl = async (e) => {
    e.preventDefault();
    setCalErrorMsg(null);
    setCalSuccessMsg(null);
    setIsSyncing(true);

    try {
      const events = await fetchCalendarFromUrl(inputCalUrl.trim());
      if (onUpdateCalendarUrl) {
        onUpdateCalendarUrl(inputCalUrl.trim());
      }
      setCalSuccessMsg(`Synchronisé avec succès ! (${events.length} événement(s) récupéré(s))`);
      setTimeout(() => {
        setIsCalendarModalOpen(false);
        setCalSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setCalErrorMsg(
        err.message ||
          "Impossible de charger ce calendrier. Utilisez « L'adresse secrète au format iCal » dans les paramètres de votre agenda Google."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered todos
  const filteredTodos = todos.filter((todo) => {
    return selectedMember === 'all' || todo.assignee === selectedMember || todo.assignee === 'all';
  });

  // Filtered calendar events (Aujourd'hui, à venir et récents)
  const nowTimestamp = new Date().setHours(0, 0, 0, 0);
  const sortedCalendarEvents = [...calendarEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const upcomingEvents = sortedCalendarEvents.filter(
    (ev) => new Date(ev.endDate || ev.startDate).getTime() >= nowTimestamp - 86400000 * 90
  );

  const displayCalendarEvents = upcomingEvents.length > 0 ? upcomingEvents : sortedCalendarEvents.slice(-15);

  const filteredEvents = displayCalendarEvents.filter((ev) => {
    return selectedMember === 'all' || ev.member === selectedMember || ev.member === 'all';
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getMemberInfo = (id) => {
    return members.find((m) => m.id === id) || { name: '', emoji: '🏠', dot: '#a1a1aa' };
  };

  const formatEventDisplay = (startDate, endDate, allDay) => {
    if (!startDate) return { dateStr: '', timeStr: '' };
    const start = new Date(startDate);
    const now = new Date();
    
    // Comparaison du jour
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
        {/* Top Header : Onglets Tâches / Agenda + Bouton d'action */}
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            {/* Bascule Tâches / Agenda */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveView('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 touch-press ${
                  activeView === 'todos'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Tâches ({todos.filter((t) => !t.completed).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 touch-press ${
                  activeView === 'agenda'
                    ? 'bg-sky-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Agenda ({calendarEvents.length})</span>
              </button>
            </div>

            {/* Bouton d'action contextuel */}
            {activeView === 'todos' ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all touch-press"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ajouter</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCalendarModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-all touch-press"
                title="Connecter Google Calendar ou Apple iCloud"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Sync Agenda</span>
              </button>
            )}
          </div>

          {/* Barre de progression des tâches (vue tâches uniquement) */}
          {activeView === 'todos' && (
            <div className="w-full bg-white/[0.05] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Filtres membres (🏠, Papa, Maman, William) */}
          <div className="flex items-center gap-2 py-2.5 px-1 overflow-x-auto scrollbar-none w-full">
            {members.map((member) => {
              const isSelected = selectedMember === member.id;
              const isAll = member.id === 'all';
              const countBadge =
                activeView === 'todos'
                  ? todos.filter((t) => !t.completed && (t.assignee === member.id || member.id === 'all')).length
                  : calendarEvents.filter((ev) => ev.member === member.id || member.id === 'all').length;

              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 touch-press ${
                    isSelected
                      ? 'bg-white/20 text-white shadow-md border border-white/30 scale-[1.02]'
                      : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-transparent'
                  }`}
                  title={isAll ? 'Toute la famille' : member.name}
                >
                  <span className="text-sm">{member.emoji}</span>
                  {!isAll && <span>{member.name}</span>}
                  {countBadge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/40 font-mono-numbers text-zinc-300">
                      {countBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 
          CORPS DU WIDGET : VUE TÂCHES OU VUE AGENDA
        */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1 min-h-[140px]">
          {/* VUE 1 : TÂCHES */}
          {activeView === 'todos' && (
            filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                <CheckCheck className="w-10 h-10 mb-2 opacity-40 text-emerald-400" />
                <p className="text-sm font-medium text-zinc-400">Toutes les tâches sont terminées !</p>
                <p className="text-xs text-zinc-600 mt-0.5">Appuyez sur « Ajouter » pour en créer une</p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const member = getMemberInfo(todo.assignee);
                const isAll = todo.assignee === 'all';

                return (
                  <div
                    key={todo.id}
                    onClick={() => handleToggle(todo.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[56px] active:scale-[0.99] touch-press ${
                      todo.completed
                        ? 'bg-white/[0.015] border-white/[0.04] opacity-50'
                        : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        className="shrink-0 p-1 transition-transform active:scale-90"
                        aria-label="Valider la tâche"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20 stroke-[2]" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-500 hover:text-emerald-400 transition-colors stroke-[2]" />
                        )}
                      </button>

                      <p
                        className={`text-sm tracking-wide leading-snug break-words line-clamp-2 ${
                          todo.completed ? 'line-through text-zinc-500 font-normal' : 'text-zinc-100 font-semibold'
                        }`}
                      >
                        {todo.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                        style={{ backgroundColor: `${member.dot}20`, color: member.dot }}
                      >
                        <span className="text-xs">{member.emoji}</span>
                        {!isAll && <span>{member.name}</span>}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(todo.id, e)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-xl transition-colors touch-press"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* VUE 2 : AGENDA FAMILIAL */}
          {activeView === 'agenda' && (
            filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                <CalendarIcon className="w-10 h-10 mb-2 opacity-40 text-sky-400" />
                <p className="text-sm font-medium text-zinc-400">Aucun rendez-vous à venir</p>
                <p className="text-xs text-zinc-600 mt-0.5">Tous les événements Google Calendar sont à jour</p>
              </div>
            ) : (
              filteredEvents.slice(0, 15).map((ev) => {
                const member = getMemberInfo(ev.member);
                const isAll = ev.member === 'all';
                const { dateStr, timeStr } = formatEventDisplay(ev.startDate, ev.endDate, ev.allDay);

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-between gap-3 shadow-sm hover:bg-white/[0.06] transition-colors"
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

                    {/* Membre assigné */}
                    <span
                      className="px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-white/10"
                      style={{ backgroundColor: `${member.dot}20`, color: member.dot }}
                    >
                      <span className="text-xs">{member.emoji}</span>
                      {!isAll && <span>{member.name}</span>}
                    </span>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Pied de widget */}
        {activeView === 'todos' && completedCount > 0 && (
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
            <span>{completedCount} tâche(s) faite(s)</span>
            <button
              onClick={handleClearCompleted}
              className="px-2 py-1 rounded-lg text-zinc-400 hover:text-rose-400 active:scale-95 transition-all touch-press"
            >
              Nettoyer
            </button>
          </div>
        )}
      </div>

      {/* Modal Tactile : Ajouter une tâche */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card bg-zinc-900/98 border-white/20 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Nouvelle tâche familiale</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTodo} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Intitulé de la tâche</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sortir les poubelles, acheter du pain..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-400 resize-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Pour qui ?</label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setNewAssignee(m.id)}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 touch-press ${
                        newAssignee === m.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span>{m.id === 'all' ? 'Toute la maison' : m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-colors shadow-md active:scale-95 touch-press"
                >
                  Créer la tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tactile : Connecter Calendrier Google / Apple */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card bg-zinc-900/98 border-white/20 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Synchroniser l'agenda familial</h3>
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarUrl} className="space-y-4">
              <div className="sub-card p-3 text-xs text-zinc-300 space-y-2 leading-relaxed border border-sky-500/20 bg-sky-950/20">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Comment obtenir le bon lien Google Calendar :</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] sm:text-xs">
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
                    required
                  />
                </div>
              </div>

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
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press disabled:opacity-50"
                >
                  {isSyncing ? 'Vérification...' : 'Enregistrer et synchroniser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
