import React, { useState } from 'react';
import { MessageSquare, Edit3, Check, Sparkles } from 'lucide-react';

export default function StickyNoteWidget({ notes, onUpdateNotes, members, className = '' }) {
  const note = notes[0] || {
    id: 'n1',
    content: 'Bienvenue sur Tablo ! Bonne journée à la maison ✨',
    author: 'Maman',
    updatedAt: Date.now(),
  };

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [author, setAuthor] = useState(note.author || 'Maman');

  const handleSave = () => {
    if (!content.trim()) return;
    const updated = [
      {
        ...note,
        content: content.trim(),
        author,
        updatedAt: Date.now(),
      },
    ];
    onUpdateNotes(updated);
    setIsEditing(false);
  };

  return (
    <div
      className={`bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] z-10">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-xs font-semibold tracking-wide text-zinc-200">
            Le mot de la maison
          </h3>
        </div>

        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-amber-300 transition-colors text-xs flex items-center gap-1 touch-press"
          title={isEditing ? 'Sauvegarder' : 'Modifier le mot'}
        >
          {isEditing ? <Check className="w-3 h-3 text-emerald-400" /> : <Edit3 className="w-3 h-3" />}
          <span className="text-[10px]">{isEditing ? 'OK' : 'Éditer'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 z-10">
        {isEditing ? (
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-black/40 border border-amber-500/30 rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none min-h-[50px] resize-none"
              placeholder="Écrivez un mot..."
              autoFocus
            />
            <div className="flex items-center justify-between">
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
              >
                {members.filter((m) => m.id !== 'all').map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.emoji} {m.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSave}
                className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="cursor-pointer group/note">
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-snug font-normal italic group-hover/note:text-white transition-colors">
              "{note.content}"
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400 z-10">
        <span className="flex items-center gap-1 text-amber-400/90 font-medium truncate">
          <Sparkles className="w-2.5 h-2.5 inline shrink-0" />
          {note.author || 'Maman'}
        </span>
        <span className="text-zinc-600">Toucher pour éditer</span>
      </div>
    </div>
  );
}
