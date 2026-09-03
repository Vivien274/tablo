import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  RefreshCw,
  Link,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchSharedGooglePhotosAlbum } from '../services/googlePhotosService';

export default function PhotoSettingsModal({
  isOpen,
  onClose,
  photos = [],
  onUpdatePhotos,
}) {
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'upload' | 'url'

  // Google Photos state
  const [googleAlbumUrl, setGoogleAlbumUrl] = useState(() => {
    return localStorage.getItem('tablo_gp_album_url') || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);

  // Manual photo state
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Sync Google Photos shared album
  const handleSyncGooglePhotos = async (e) => {
    e?.preventDefault();
    if (!googleAlbumUrl.trim()) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const result = await fetchSharedGooglePhotosAlbum(googleAlbumUrl);
      if (result.photos && result.photos.length > 0) {
        localStorage.setItem('tablo_gp_album_url', googleAlbumUrl.trim());
        onUpdatePhotos(result.photos);
        setSyncSuccess(`${result.count} photos synchronisées depuis « ${result.title} » !`);
        setTimeout(() => {
          onClose();
          setSyncSuccess(null);
        }, 1500);
      } else {
        setSyncError('Aucune photo trouvée dans cet album.');
      }
    } catch (err) {
      setSyncError(err.message || 'Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add custom photo via URL
  const handleAddCustomPhoto = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newPhoto = {
      id: 'custom-' + Date.now(),
      url: newUrl.trim(),
      title: newTitle.trim() || 'Souvenir de famille',
      location: newLocation.trim() || 'Maison',
      date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    };

    onUpdatePhotos([newPhoto, ...photos]);
    setNewUrl('');
    setNewTitle('');
    setNewLocation('');
    onClose();
  };

  // File upload as Base64
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto = {
        id: 'upload-' + Date.now(),
        url: reader.result,
        title: file.name.replace(/\.[^/.]+$/, ''),
        location: 'Galerie Tablette',
        date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      };
      onUpdatePhotos([newPhoto, ...photos]);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bento-card bg-zinc-900/95 border-white/20 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Photos de l'écran de veille</h3>
              <p className="text-xs text-zinc-400">
                {photos.length} photo{photos.length > 1 ? 's' : ''} active{photos.length > 1 ? 's' : ''} dans le diaporama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Google Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Importer fichier</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Lien URL direct</span>
          </button>
        </div>

        {/* ONGLET 1 : GOOGLE PHOTOS ALBUM PARTAGÉ */}
        {activeTab === 'google' && (
          <form onSubmit={handleSyncGooglePhotos} className="space-y-4 pt-1">
            <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-2 leading-relaxed border border-sky-500/20 bg-sky-950/20">
              <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Comment connecter un album Google Photos :</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] sm:text-xs">
                <li>Ouvrez <strong>Google Photos</strong> sur votre smartphone ou ordinateur.</li>
                <li>Créez ou sélectionnez votre album partagé de famille.</li>
                <li>Appuyez sur <strong>Partager</strong> &gt; <strong>Créer un lien</strong>.</li>
                <li>Collez l'adresse ci-dessous <em>(ex: <code>https://photos.app.goo.gl/...</code>)</em>.</li>
              </ol>
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">
                Lien de l'album partagé Google Photos
              </label>
              <div className="relative">
                <Link className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://photos.app.goo.gl/..."
                  value={googleAlbumUrl}
                  onChange={(e) => setGoogleAlbumUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 placeholder-zinc-600"
                  required
                />
              </div>
            </div>

            {syncError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {syncError}
              </div>
            )}

            {syncSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{syncSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2.5 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors flex items-center gap-1.5 active:scale-95 touch-press disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronisation...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synchroniser l'album</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ONGLET 2 : IMPORT LOCAL */}
        {activeTab === 'upload' && (
          <div className="space-y-4 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 px-4 rounded-2xl border border-dashed border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2.5 transition-all touch-press"
            >
              <Upload className="w-7 h-7 text-sky-400" />
              <span>Choisir une photo depuis la tablette</span>
              <span className="text-[11px] text-zinc-400">JPG, PNG, WebP acceptés</span>
            </button>
          </div>
        )}

        {/* ONGLET 3 : LIEN URL DIRECT */}
        {activeTab === 'url' && (
          <form onSubmit={handleAddCustomPhoto} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Lien URL direct de l'image</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                required
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Titre ou légende (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Vacances d'été"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors active:scale-95 touch-press"
              >
                Ajouter la photo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
