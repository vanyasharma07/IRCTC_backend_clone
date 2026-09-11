import { useState, useMemo } from 'react';
import SearchForm from '../components/search/SearchForm';
import TrainList from '../components/search/TrainList';
import Spinner from '../components/ui/Spinner';
import { useSearchStore } from '../store/search.store';
import { Train, Filter, Sparkles, AlertCircle } from 'lucide-react';

export default function SearchPage() {
  const { results, isSearching } = useSearchStore();
  const [filterType, setFilterType] = useState('ALL'); // ALL | FASTEST | MORNING | EVENING

  const trains = results?.trains || [];

  const filteredTrains = useMemo(() => {
    if (!trains.length) return [];
    if (filterType === 'FASTEST') {
      return [...trains].sort((a, b) => (b.isFastest ? 1 : 0) - (a.isFastest ? 1 : 0));
    }
    if (filterType === 'MORNING') {
      return trains.filter((t) => {
        const dep = t.from?.departure || '';
        const hour = parseInt(dep.split(':')[0], 10);
        return hour >= 4 && hour < 12;
      });
    }
    if (filterType === 'EVENING') {
      return trains.filter((t) => {
        const dep = t.from?.departure || '';
        const hour = parseInt(dep.split(':')[0], 10);
        return hour >= 16 && hour < 24;
      });
    }
    return trains;
  }, [trains, filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Train className="w-7 h-7 text-cyan-600" />
          <span>Train Schedules & Availability</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore schedules, live seat quotas, and real-time berth allocations.
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="card bg-white border border-slate-200/90 shadow-glass mb-8">
        <SearchForm compact />
      </div>

      {/* Results or Loading */}
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner size="lg" />
          <p className="text-sm font-semibold text-slate-600 mt-4">Searching matching routes & seat inventories...</p>
        </div>
      ) : results ? (
        <div>
          {/* Filter Bar & Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200/80">
            <div className="text-sm text-slate-600">
              Found <strong className="text-slate-900 font-mono text-base">{filteredTrains.length}</strong> train
              {filteredTrains.length !== 1 ? 's' : ''}
              {results.from?.resolved && ` from ${results.from.resolved}`}
              {results.to?.resolved && ` to ${results.to.resolved}`}
              {results.date && results.date !== 'any' && ` on ${results.date}`}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-cyan-600" /> Filter:
              </span>
              {[
                { id: 'ALL', label: 'All Trains' },
                { id: 'MORNING', label: 'Morning (04:00 - 12:00)' },
                { id: 'EVENING', label: 'Evening (16:00 - 24:00)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === f.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTrains.length > 0 ? (
            <TrainList trains={filteredTrains} />
          ) : (
            <div className="text-center py-16 card bg-slate-50 border border-slate-200 text-slate-500">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-base text-slate-800">No trains matched your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the filter to 'All Trains'.</p>
              <button
                onClick={() => setFilterType('ALL')}
                className="mt-4 btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-slate-50 border border-slate-200 text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-black text-lg text-slate-800">Plan Your Journey</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Choose origin and destination stations above to view live trains, seat availability, and fare options.
          </p>
        </div>
      )}
    </div>
  );
}
