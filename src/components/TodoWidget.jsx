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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';

export default function TodoWidget({
  todos = [],
  onUpdateTodos,
  members = [],
}) {
  const [selectedMember, setSelectedMember] = useState('all');

  // Todo Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('all');

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

  // Filtered todos
  const filteredTodos = todos.filter((todo) => {
    return selectedMember === 'all' || todo.assignee === selectedMember || todo.assignee === 'all';
  });

  const remainingCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getMemberInfo = (id) => {
    return members.find((m) => m.id === id) || { name: '', emoji: '🏠', dot: '#a1a1aa' };
  };

  return (
    <>
      <div className="bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group w-full">
        {/* Top Header : Titre + Progression + Bouton Ajouter */}
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <ListTodo className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Tâches familiales
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-numbers">
                  {remainingCount} restante{remainingCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Bouton Ajouter */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all touch-press"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Barre de progression des tâches */}
          <div className="w-full bg-white/[0.05] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Filtres membres (🏠, Papa, Maman, William) */}
          <div className="flex items-center gap-2 py-2.5 px-1 overflow-x-auto scrollbar-none w-full">
            {members.map((member) => {
              const isSelected = selectedMember === member.id;
              const isAll = member.id === 'all';
              const countBadge = todos.filter(
                (t) => !t.completed && (t.assignee === member.id || member.id === 'all')
              ).length;

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

        {/* Liste des tâches */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1 min-h-[140px]">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
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
          )}
        </div>

        {/* Pied de widget */}
        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
          <span>{completedCount > 0 ? `${completedCount} tâche(s) faite(s)` : `${totalCount} tâche(s) au total`}</span>
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-2 py-1 rounded-lg text-zinc-400 hover:text-rose-400 active:scale-95 transition-all touch-press"
            >
              Nettoyer
            </button>
          )}
        </div>
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
    </>
  );
}
