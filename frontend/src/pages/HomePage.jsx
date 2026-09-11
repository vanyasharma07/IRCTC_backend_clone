import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchForm from '../components/search/SearchForm';
import BookingCard from '../components/bookings/BookingCard';
import { useAuthStore } from '../store/auth.store';
import { useSearchStore } from '../store/search.store';
import { bookingApi } from '../api/booking.api';
import { searchApi } from '../api/search.api';
import {
  Train,
  Zap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const POPULAR_ROUTES = [
  { from: 'NDLS', to: 'BSB', label: 'Delhi ⇄ Varanasi', train: 'Vande Bharat Exp', time: '8h 00m' },
  { from: 'CSMT', to: 'MAO', label: 'Mumbai ⇄ Goa', train: 'Tejas Express', time: '8h 20m' },
  { from: 'SBC', to: 'MAS', label: 'Bengaluru ⇄ Chennai', train: 'Shatabdi Express', time: '4h 45m' },
  { from: 'HWH', to: 'NDLS', label: 'Howrah ⇄ Delhi', train: 'Rajdhani Express', time: '17h 10m' },
];

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { setSearchParams, setResults, setSearching } = useSearchStore();
  const navigate = useNavigate();

  const [recentBookings, setRecentBookings] = useState([]);
  const [pnrInput, setPnrInput] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      bookingApi
        .list(null, 1, 3)
        .then((res) => {
          const data = res.data || res;
          setRecentBookings(data.bookings || []);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleQuickRoute = async (route) => {
    const today = new Date().toISOString().split('T')[0];
    setSearchParams(route.from, route.to, today);
    setSearching(true);
    try {
      const res = await searchApi.search(route.from, route.to, today);
      setResults(res.data || res);
      navigate('/search');
    } catch {
      setSearching(false);
      navigate('/search');
    }
  };

  const handlePnrLookup = (e) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    navigate(`/bookings/${pnrInput.trim()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 text-white pt-12 pb-24 px-4 sm:px-6">
        {/* Ambient background glow accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Next-Generation Passenger Rail Reservation
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              Smarter, Faster <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">Train Journeys</span>
            </h1>
            <p className="mt-4 text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
              Experience zero-latency seat locks, instant ticket confirmation, and guaranteed automated refunds across India’s high-speed rail corridors.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-800">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
                <Train className="w-5 h-5 text-cyan-600" />
                <span>Search Train Schedules & Berths</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Live Inventory Guaranteed
              </span>
            </div>
            <SearchForm />
          </div>

          {/* Popular High Speed Corridors */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Popular Corridors:
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ROUTES.map((route, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickRoute(route)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all hover:scale-105"
                >
                  <span className="font-semibold text-cyan-300">{route.label}</span>
                  <span className="text-[10px] text-slate-400">• {route.train}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-20">
        {/* Quick PNR Lookup Card & Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* PNR Tracker */}
          <div className="lg:col-span-4 card bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Track Booking / PNR</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Instant Status
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Check live berth status, coach numbers, chart preparation, and passenger details for your reservation.
              </p>
              <form onSubmit={handlePnrLookup} className="space-y-3">
                <input
                  type="text"
                  value={pnrInput}
                  onChange={(e) => setPnrInput(e.target.value)}
                  placeholder="Enter Booking ID (e.g. 104)"
                  className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="w-full btn bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-neon py-2.5 text-sm rounded-xl"
                >
                  Lookup Booking
                </button>
              </form>
            </div>
            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between mt-4">
              <span>Auto-sync with railway chart</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-left p-6 flex flex-col justify-between group hover:border-cyan-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 mb-1.5">Zero-Latency Locks</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Distributed Redis locking guarantees no double bookings. Your seat is held securely for 10 minutes during payment.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-cyan-600 flex items-center gap-1 mt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="card text-left p-6 flex flex-col justify-between group hover:border-amber-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 mb-1.5">Automated Refunds</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Saga pattern orchestration triggers immediate reversal if seats or payment encounter any failures.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-amber-600 flex items-center gap-1 mt-2">
                View policy <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="card text-left p-6 flex flex-col justify-between group hover:border-purple-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 mb-1.5">Segment-Aware</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Intelligent station sequence algorithm lets intermediate passengers book available segments on running trains.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-purple-600 flex items-center gap-1 mt-2">
                Route planner <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings Section */}
        {isAuthenticated && recentBookings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-600" />
                <h2 className="text-xl font-bold text-slate-900">Your Recent Bookings</h2>
              </div>
              <Link
                to="/bookings"
                className="text-sm font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                View all bookings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
