import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Sparkles,
  Link,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  RefreshCw,
  Search,
  Navigation,
  Loader2,
} from 'lucide-react';
import { CALENDAR_COLOR_PRESETS, fetchMultipleCalendars } from '../services/calendarService';
import { fetchSharedGooglePhotosAlbum } from '../services/googlePhotosService';
import { DEFAULT_CITIES, searchCities } from '../services/weatherService';

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

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'calendars',
  // Calendars
  calendars = [],
  onUpdateCalendars,
  calendarWebhookUrl = '',
  onUpdateCalendarWebhookUrl,
  // Photos
  googleAlbumUrl = '',
  onUpdateGoogleAlbumUrl,
  onUpdatePhotos,
  // City
  currentCity,
  onSelectCity,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'calendars' | 'webhook' | 'photos' | 'city'

  // Local state for editing calendars
  const [editingCalendars, setEditingCalendars] = useState([]);
  const [inputWebhookUrl, setInputWebhookUrl] = useState(calendarWebhookUrl || '');
  const [activeColorPickerIndex, setActiveColorPickerIndex] = useState(null);
  const [isSavingCal, setIsSavingCal] = useState(false);
  const [calSuccessMsg, setCalSuccessMsg] = useState(null);
  const [calErrorMsg, setCalErrorMsg] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Local state for Photos
  const [inputAlbumUrl, setInputAlbumUrl] = useState(googleAlbumUrl || '');
  const [isSyncingPhotos, setIsSyncingPhotos] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState(null);

  // Local state for City
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isLocatingCity, setIsLocatingCity] = useState(false);

  // Synchroniser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'calendars');
      setEditingCalendars(
        calendars && calendars.length > 0
          ? JSON.parse(JSON.stringify(calendars))
          : [
              {
                id: 'cal-default',
                name: 'Principal',
                color: '#38bdf8',
                url: '',
                enabled: true,
              },
            ]
      );
      setInputWebhookUrl(calendarWebhookUrl || '');
      setInputAlbumUrl(googleAlbumUrl || '');
      setCalSuccessMsg(null);
      setCalErrorMsg(null);
      setPhotoSuccessMsg(null);
      setPhotoErrorMsg(null);
    }
  }, [isOpen, initialTab, calendars, calendarWebhookUrl, googleAlbumUrl]);

  if (!isOpen) return null;

  // Calendars methods
  const handleAddCalendarRow = () => {
    const nextIndex = editingCalendars.length;
    const preset = CALENDAR_COLOR_PRESETS[nextIndex % CALENDAR_COLOR_PRESETS.length];
    const newCal = {
      id: `cal-${Date.now()}`,
      name: `Agenda ${nextIndex + 1}`,
      color: preset.value,
      url: '',
      enabled: true,
    };
    setEditingCalendars([...editingCalendars, newCal]);
  };

  const handleUpdateCalendarRow = (index, field, value) => {
    setEditingCalendars((prev) =>
      prev.map((cal, i) => (i === index ? { ...cal, [field]: value } : cal))
    );
  };

  const handleDeleteCalendarRow = (index) => {
    if (editingCalendars.length <= 1) return;
    setEditingCalendars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    });
  };

  const handleSaveCalendars = async (e) => {
    e?.preventDefault();
    setCalErrorMsg(null);
    setCalSuccessMsg(null);
    setIsSavingCal(true);

    try {
      const validCalendars = editingCalendars.map((c) => ({
        ...c,
        name: c.name.trim() || 'Agenda',
        url: c.url.trim(),
      }));

      if (onUpdateCalendars) {
        onUpdateCalendars(validCalendars);
      }
      if (onUpdateCalendarWebhookUrl) {
        onUpdateCalendarWebhookUrl(inputWebhookUrl.trim());
      }

      const activeToFetch = validCalendars.filter((c) => c.enabled && c.url);
      if (activeToFetch.length > 0) {
        const events = await fetchMultipleCalendars(activeToFetch);
        if (events.length > 0) {
          setCalSuccessMsg(`Synchronisé avec succès ! (${events.length} événement(s) récupéré(s))`);
          setTimeout(() => {
            onClose();
            setCalSuccessMsg(null);
          }, 1400);
        } else {
          setCalErrorMsg(
            `0 événement à venir trouvé sur les ${activeToFetch.length} agenda(s). Vérifiez vos adresses secrètes iCal (se terminant par /basic.ics).`
          );
        }
      } else {
        setCalSuccessMsg('Agendas enregistrés !');
        setTimeout(() => {
          onClose();
          setCalSuccessMsg(null);
        }, 1400);
      }
    } catch (err) {
      setCalErrorMsg(err.message || 'Erreur lors de la synchronisation.');
    } finally {
      setIsSavingCal(false);
    }
  };

  // Photos methods
  const handleSavePhotos = async (e) => {
    e?.preventDefault();
    if (!inputAlbumUrl.trim()) return;

    setIsSyncingPhotos(true);
    setPhotoErrorMsg(null);
    setPhotoSuccessMsg(null);

    try {
      const result = await fetchSharedGooglePhotosAlbum(inputAlbumUrl.trim());
      if (result.photos && result.photos.length > 0) {
        if (onUpdateGoogleAlbumUrl) onUpdateGoogleAlbumUrl(inputAlbumUrl.trim());
        if (onUpdatePhotos) onUpdatePhotos(result.photos);
        setPhotoSuccessMsg(`${result.count} photos synchronisées depuis « ${result.title} » !`);
        setTimeout(() => {
          onClose();
          setPhotoSuccessMsg(null);
        }, 1400);
      } else {
        setPhotoErrorMsg('Aucune photo trouvée dans cet album.');
      }
    } catch (err) {
      setPhotoErrorMsg(err.message || 'Erreur lors de la synchronisation de l’album.');
    } finally {
      setIsSyncingPhotos(false);
    }
  };

  // City methods
  const handleSearchCity = async (e) => {
    e?.preventDefault();
    if (!citySearchQuery.trim() || citySearchQuery.length < 2) return;
    setIsSearchingCity(true);
    const results = await searchCities(citySearchQuery);
    setCitySearchResults(results);
    setIsSearchingCity(false);
  };

  const handleGeolocateCity = () => {
    if (!navigator.geolocation) return;
    setIsLocatingCity(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (onSelectCity) {
          onSelectCity({
            name: 'Position Actuelle',
            label: 'Position détectée par GPS',
            lat: latitude,
            lon: longitude,
          });
        }
        setIsLocatingCity(false);
        onClose();
      },
      () => {
        setIsLocatingCity(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectCityPreset = (targetCity) => {
    if (onSelectCity) {
      onSelectCity(targetCity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bento-card bg-zinc-900/98 border-white/20 max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Paramètres de Tablo</h3>
              <p className="text-[11px] text-zinc-400">Configuration générale et synchronisations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl touch-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Onglets */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calendars')}
            className={`flex-1 min-w-[130px] py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'calendars'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Agendas Google ({editingCalendars.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`flex-1 min-w-[130px] py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajout Google Webhook</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 min-w-[120px] py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'photos'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos & Cadre</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('city')}
            className={`flex-1 min-w-[120px] py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'city'
                ? 'bg-sky-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Météo ({currentCity?.name || 'Ville'})</span>
          </button>
        </div>

        {/* Contenu Onglet */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. AGENDAS GOOGLE */}
          {activeTab === 'calendars' && (
            <form onSubmit={handleSaveCalendars} className="space-y-3.5">
              <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-1.5 leading-relaxed border border-sky-500/20 bg-sky-950/20">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Comment connecter vos agendas Google :</span>
                </p>
                <p className="text-[11px] sm:text-xs text-zinc-300">
                  Sur ordinateur, dans Google Agenda : <strong>3 petits points à côté de l'agenda &gt; Paramètres et partage &gt; Intégrer l'agenda &gt; Adresse SECRÈTE au format iCal</strong>.
                </p>
              </div>

              {/* Liste des calendriers */}
              <div className="space-y-3">
                {editingCalendars.map((cal, idx) => (
                  <div
                    key={cal.id || idx}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Sélecteur couleur */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveColorPickerIndex(
                                activeColorPickerIndex === idx ? null : idx
                              )
                            }
                            className="w-7 h-7 rounded-xl border-2 border-white/20 flex items-center justify-center shadow transition-transform active:scale-95"
                            style={{ backgroundColor: cal.color }}
                            title="Changer la couleur"
                          >
                            <Palette className="w-3.5 h-3.5 text-zinc-950/70" />
                          </button>

                          {activeColorPickerIndex === idx && (
                            <div className="absolute left-0 top-9 z-20 p-2 rounded-xl bg-zinc-900 border border-white/20 shadow-2xl grid grid-cols-4 gap-1.5 animate-in fade-in zoom-in-95">
                              {CALENDAR_COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateCalendarRow(idx, 'color', preset.value);
                                    setActiveColorPickerIndex(null);
                                  }}
                                  className="w-6 h-6 rounded-lg border border-white/20 transition-transform hover:scale-110 active:scale-90"
                                  style={{ backgroundColor: preset.value }}
                                  title={preset.label}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Nom */}
                        <input
                          type="text"
                          value={cal.name}
                          onChange={(e) =>
                            handleUpdateCalendarRow(idx, 'name', e.target.value)
                          }
                          placeholder="Ex: Vivien, Famille, Marchés..."
                          className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-sky-400 flex-1"
                          required
                        />
                      </div>

                      {/* Visible / Masqué */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCalendarRow(idx, 'enabled', !cal.enabled)
                        }
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                          cal.enabled !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border-white/10'
                        }`}
                      >
                        {cal.enabled !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Actif</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Masqué</span>
                          </>
                        )}
                      </button>

                      {editingCalendars.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCalendarRow(idx)}
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                          title="Supprimer cet agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* URL */}
                    <div className="relative">
                      <Link className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
                        value={cal.url}
                        onChange={(e) =>
                          handleUpdateCalendarRow(idx, 'url', e.target.value)
                        }
                        className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-[11px] sm:text-xs text-white focus:outline-none focus:border-sky-400 placeholder-zinc-600 font-mono-numbers"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCalendarRow}
                className="w-full py-2.5 rounded-xl border border-dashed border-sky-400/40 hover:border-sky-400 hover:bg-sky-500/10 text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 touch-press"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Ajouter un autre agenda Google</span>
              </button>

              {calErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{calErrorMsg}</span>
                </div>
              )}

              {calSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{calSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSavingCal}
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingCal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synchronisation...</span>
                    </>
                  ) : (
                    <span>Enregistrer et Synchroniser</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 2. GOOGLE APPS SCRIPT WEBHOOK */}
          {activeTab === 'webhook' && (
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
                  <li>Cliquez sur <strong>Déployer &gt; Nouveau déploiement</strong>.</li>
                  <li>
                    Sélectionnez type <strong>Application Web</strong>, choisissez <em>« Exécuter en tant que : Moi »</em> et <em>« Qui a accès : Tout le monde »</em>.
                  </li>
                  <li>Collez l'URL de l'application Web obtenue dans le champ ci-dessous.</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-400 font-medium">Script Google officiel :</span>
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
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 placeholder-zinc-600 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateCalendarWebhookUrl) onUpdateCalendarWebhookUrl(inputWebhookUrl.trim());
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press"
                >
                  Enregistrer l'URL Webhook
                </button>
              </div>
            </div>
          )}

          {/* 3. CADRE PHOTOS */}
          {activeTab === 'photos' && (
            <form onSubmit={handleSavePhotos} className="space-y-3.5">
              <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-1.5 leading-relaxed border border-sky-500/20 bg-sky-950/20">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Album Google Photos partagé :</span>
                </p>
                <p className="text-[11px] text-zinc-300">
                  Créez un album partagé dans Google Photos, cliquez sur <strong>Partager &gt; Créer un lien</strong>, et collez le lien ci-dessous pour alimenter le cadre photo du mode veille.
                </p>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">
                  Lien de partage de l'album Google Photos
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://photos.app.goo.gl/..."
                    value={inputAlbumUrl}
                    onChange={(e) => setInputAlbumUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 font-mono-numbers"
                  />
                </div>
              </div>

              {photoErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{photoErrorMsg}</span>
                </div>
              )}

              {photoSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{photoSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSyncingPhotos}
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 transition-colors shadow-md active:scale-95 touch-press disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncingPhotos ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synchronisation de l'album...</span>
                    </>
                  ) : (
                    <span>Enregistrer l'album Photos</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 4. VILLE & MÉTÉO */}
          {activeTab === 'city' && (
            <div className="space-y-4">
              <div className="sub-card p-3.5 text-xs text-zinc-300 space-y-1.5 leading-relaxed border border-sky-500/20 bg-sky-950/20">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Localisation actuelle :</span>
                </p>
                <p className="text-sm font-bold text-white">
                  {currentCity?.name} <span className="text-xs font-normal text-zinc-400">({currentCity?.label})</span>
                </p>
              </div>

              {/* Bouton GPS */}
              <button
                type="button"
                onClick={handleGeolocateCity}
                disabled={isLocatingCity}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors touch-press disabled:opacity-50"
              >
                {isLocatingCity ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Détection de votre position GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Détecter ma position actuelle (GPS)</span>
                  </>
                )}
              </button>

              {/* Recherche de commune */}
              <form onSubmit={handleSearchCity} className="space-y-2">
                <label className="text-xs text-zinc-400 block font-medium">Rechercher une commune en France ou dans le monde</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ex: Comines, Lille, Tourcoing..."
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingCity}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isSearchingCity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Chercher</span>
                  </button>
                </div>
              </form>

              {/* Résultats de recherche */}
              {citySearchResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <p className="text-[11px] text-zinc-400 font-medium">Résultats trouvés :</p>
                  {citySearchResults.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectCityPreset(c)}
                      className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/30 text-xs text-white flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold">{c.name} <span className="font-normal text-zinc-400">({c.label})</span></span>
                      <Check className="w-4 h-4 text-sky-400 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

              {/* Villes suggérées */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-zinc-400 font-medium">Villes fréquentes :</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_CITIES.map((c) => {
                    const isSelected = currentCity?.name === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSelectCityPreset(c)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="truncate">{c.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{c.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
