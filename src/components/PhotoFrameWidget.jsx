import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Calendar,
  X,
  Upload,
  RefreshCw,
  Link,
  Check,
  Sparkles,
} from 'lucide-react';
import { fetchSharedGooglePhotosAlbum } from '../services/googlePhotosService';

export default function PhotoFrameWidget({ photos, onUpdatePhotos }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Auto advance timer
  useEffect(() => {
    if (!isPlaying || photos.length <= 1 || isModalOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, photos.length, isModalOpen]);

  // Periodic auto-sync for Google Photos (every 60 min)
  useEffect(() => {
    if (!googleAlbumUrl) return;

    const syncAlbum = async () => {
      try {
        const result = await fetchSharedGooglePhotosAlbum(googleAlbumUrl);
        if (result.photos && result.photos.length > 0) {
          onUpdatePhotos(result.photos);
        }
      } catch (e) {
        console.warn('Auto-sync Google Photos failed:', e);
      }
    };

    const timer = setInterval(syncAlbum, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [googleAlbumUrl, onUpdatePhotos]);

  const currentPhoto = photos[currentIndex] || photos[0];

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

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
        setCurrentIndex(0);
        setSyncSuccess(`${result.count} photos synchronisées depuis « ${result.title} » !`);
        setTimeout(() => {
          setIsModalOpen(false);
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
    setIsModalOpen(false);
    setCurrentIndex(0);
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
      setCurrentIndex(0);
      setIsModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="bento-card w-full h-full flex flex-col justify-between relative overflow-hidden group min-h-[240px]">
        {/* Background Image with smooth Ken Burns animation */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950 w-full h-full">
          {photos.map((photo, idx) => (
            <img
              key={photo.id || idx}
              src={photo.url}
              alt={photo.title || 'Photo Tablo'}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                idx === currentIndex ? 'opacity-90 animate-ken-burns scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
              loading="eager"
            />
          ))}

          {/* Gradients to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
        </div>

        {/* Top bar controls */}
        <div className="flex items-center justify-between p-4 sm:p-5 z-10 opacity-90 group-hover:opacity-100 transition-opacity w-full">
          {/* Subtle Google Photos badge if synced */}
          {googleAlbumUrl ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-[11px] font-medium text-sky-300 shadow-sm">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Google Photos</span>
            </div>
          ) : <div />}

          {/* Player controls */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/15 backdrop-blur-md rounded-full p-1 shadow-lg">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors touch-press"
              title={isPlaying ? 'Mettre en pause' : 'Lancer le diaporama'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors touch-press"
              title="Photo précédente"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors touch-press"
              title="Photo suivante"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-white/20 text-sky-400 transition-colors touch-press ml-0.5"
              title="Connecter Google Photos ou ajouter des photos"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Metadata overlay */}
        <div className="p-4 sm:p-5 z-10 flex items-end justify-between w-full">
          <div className="space-y-0.5 max-w-[80%]">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-white tracking-wide drop-shadow-md truncate">
              {currentPhoto?.title || 'Souvenir'}
            </h4>
            <div className="flex items-center gap-3 text-xs text-zinc-300 drop-shadow">
              {currentPhoto?.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                  {currentPhoto.location}
                </span>
              )}
              {currentPhoto?.date && (
                <span className="flex items-center gap-1 text-zinc-400 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {currentPhoto.date}
                </span>
              )}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1 shrink-0">
            {photos.slice(0, 6).map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal : Gestion des photos & Album Partagé Google Photos */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card bg-zinc-900/95 border-white/20 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Source des photos</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
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
                <div className="sub-card p-3 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <span>💡 Comment récupérer le lien :</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                    <li>Ouvrez <strong>Google Photos</strong> sur votre téléphone.</li>
                    <li>Créez ou ouvrez un album (ex: <em>« Cadre Maison »</em>).</li>
                    <li>Appuyez sur <strong>Partager</strong> &gt; <strong>Créer un lien</strong>.</li>
                    <li>Collez ce lien ci-dessous (ex: <code className="text-sky-300">https://photos.app.goo.gl/...</code>).</li>
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

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors flex items-center gap-1.5"
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
                  className="w-full py-6 px-4 rounded-xl border border-dashed border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition-all touch-press"
                >
                  <Upload className="w-6 h-6 text-sky-400" />
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
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Titre ou légende</label>
                  <input
                    type="text"
                    placeholder="Ex: Vacances d'été"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
