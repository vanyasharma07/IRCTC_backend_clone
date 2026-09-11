import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StationAutocomplete from './StationAutocomplete';
import Button from '../ui/Button';
import { searchApi } from '../../api/search.api';
import { useSearchStore } from '../../store/search.store';
import { useToast } from '../ui/Toast';
import { ArrowLeftRight, Calendar, Search, Sparkles } from 'lucide-react';

export default function SearchForm({ compact }) {
  const { from, to, date, setSearchParams, setResults, setSearching, isSearching } = useSearchStore();
  const [fromCode, setFromCode] = useState(from);
  const [toCode, setToCode] = useState(to);
  const [travelDate, setTravelDate] = useState(date);
  const [swapping, setSwapping] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    setFromCode(from);
    setToCode(to);
    setTravelDate(date);
  }, [from, to, date]);

  const handleSwap = () => {
    setSwapping(true);
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
    setTimeout(() => setSwapping(false), 300);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!fromCode || !toCode) {
      showToast('Please select both Origin and Destination stations', 'warning');
      return;
    }
    setSearchParams(fromCode, toCode, travelDate);
    setSearching(true);

    try {
      const res = await searchApi.search(fromCode, toCode, travelDate);
      setResults(res.data || res);
      navigate('/search');
    } catch (err) {
      showToast(err.message || 'Search failed', 'error');
      setSearching(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <form onSubmit={handleSearch} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end' : 'grid grid-cols-1 md:grid-cols-12 gap-4 items-end'}>
        {/* Origin */}
        <div className={compact ? 'sm:col-span-1 lg:col-span-4' : 'md:col-span-4'}>
          <StationAutocomplete
            label="Origin Station"
            value={fromCode}
            onChange={(code) => setFromCode(code)}
            placeholder="From (e.g. NDLS / New Delhi)"
          />
        </div>

        {/* Swap Button */}
        <div className={`flex justify-center items-center ${compact ? 'lg:col-span-1' : 'md:col-span-1'} pb-1`}>
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className={`w-10 h-10 rounded-xl bg-slate-100 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 flex items-center justify-center transition-all duration-300 shadow-sm ${
              swapping ? 'rotate-180 scale-95' : 'hover:scale-105'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className={compact ? 'sm:col-span-1 lg:col-span-4' : 'md:col-span-4'}>
          <StationAutocomplete
            label="Destination Station"
            value={toCode}
            onChange={(code) => setToCode(code)}
            placeholder="To (e.g. BSB / Varanasi)"
          />
        </div>

        {/* Date */}
        <div className={compact ? 'sm:col-span-2 lg:col-span-3' : 'md:col-span-3'}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              Journey Date
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTravelDate(today)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  travelDate === today ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTravelDate(tomorrow)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  travelDate === tomorrow ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={today}
            className="input-field font-medium cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Supports fuzzy station codes (e.g., NDLS, CSMT, HWH) and city names</span>
        </div>
        <Button
          type="submit"
          loading={isSearching}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 via-blue-700 to-primary-900 hover:from-cyan-500 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-neon transition-all"
        >
          <Search className="w-4 h-4 mr-1.5" />
          Find Available Trains
        </Button>
      </div>
    </form>
  );
}
