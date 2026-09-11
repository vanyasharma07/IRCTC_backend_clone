import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchApi } from '../../api/search.api';
import { MapPin, Loader2, Building2 } from 'lucide-react';

export default function StationAutocomplete({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchApi.autocomplete(debouncedQuery).then((res) => {
      if (!cancelled) {
        setSuggestions(res.data || []);
        setOpen(true);
      }
    }).catch(() => {
      if (!cancelled) setSuggestions([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value !== undefined && value !== query) setQuery(value);
  }, [value]);

  const handleSelect = (station) => {
    setQuery(`${station.name} (${station.code})`);
    onChange(station.code, station.name);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-cyan-600" />
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length < 2) onChange('', '');
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-field pr-10 font-medium text-slate-800"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-600">
            <Loader2 className="animate-spin h-4 w-4" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 w-full mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-slide-up">
          {suggestions.map((s) => (
            <li
              key={s.stationId || s.code}
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-cyan-50/80 cursor-pointer text-sm flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-cyan-100 text-slate-600 group-hover:text-cyan-700 flex items-center justify-center transition-colors">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-cyan-900">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.city || 'Indian Railways'}</p>
                </div>
              </div>
              <span className="font-mono text-xs font-black px-2 py-1 rounded bg-slate-100 group-hover:bg-cyan-200/60 text-slate-700 group-hover:text-cyan-900 border border-slate-200">
                {s.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
