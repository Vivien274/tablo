import React, { useState } from 'react';
import { MapPin, Search, Navigation, X, Check, Loader2 } from 'lucide-react';
import { DEFAULT_CITIES, searchCities } from '../services/weatherService';

export default function CityModal({ isOpen, onClose, onSelectCity, currentCity }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    const results = await searchCities(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        onSelectCity({
          name: 'Position Actuelle',
          label: 'Position détectée par GPS',
          lat: latitude,
          lon: longitude,
        });
        setIsLocating(false);
        onClose();
      },
      (err) => {
        console.error(err);
        alert('Impossible de récupérer votre position GPS.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bento-card bg-zinc-900/95 border-white/20 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-white">Changer la localisation météo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Quick Button */}
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={isLocating}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all touch-press"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : (
            <Navigation className="w-4 h-4 text-sky-400" />
          )}
          <span>{isLocating ? 'Recherche GPS en cours...' : 'Utiliser ma position actuelle (GPS)'}</span>
        </button>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une ville (ex: Rennes, Chamonix, Nice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400 placeholder-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-sky-500 text-zinc-950 font-semibold text-xs hover:bg-sky-400 transition-colors shrink-0 flex items-center gap-1"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Chercher'}
          </button>
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Résultats de recherche
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 hover:text-sky-300 border border-white/[0.06] text-xs sm:text-sm text-zinc-200 transition-colors flex items-center justify-between"
                >
                  <span>{city.label}</span>
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preset French Cities */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Villes populaires
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEFAULT_CITIES.map((city) => {
              const isSelected = currentCity?.name === city.name;
              return (
                <button
                  key={city.name}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between touch-press ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span className="truncate">{city.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
