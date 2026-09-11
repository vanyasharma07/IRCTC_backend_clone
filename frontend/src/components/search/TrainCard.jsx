import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../store/booking.store';
import { useAuthStore } from '../../store/auth.store';
import { formatSeatType } from '../../utils/format';
import Button from '../ui/Button';
import { Train, Clock, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function TrainCard({ train }) {
  const navigate = useNavigate();
  const setSelectedTrain = useBookingStore((s) => s.setSelectedTrain);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const schedule = train.schedule;
  const seatSummary = train.seatSummary || {};

  const handleCheckAvailability = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/seats/${schedule.scheduleId}`)}`);
      return;
    }
    setSelectedTrain(train, schedule.scheduleId);
    navigate(`/seats/${schedule.scheduleId}`);
  };

  const isHighSpeed =
    train.trainName?.toLowerCase().includes('vande') ||
    train.trainName?.toLowerCase().includes('tejas') ||
    train.trainName?.toLowerCase().includes('rajdhani') ||
    train.trainName?.toLowerCase().includes('shatabdi');

  return (
    <div className="card bg-white border border-slate-200/90 hover:border-cyan-400/80 hover:shadow-glass-hover transition-all duration-300 group">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-sm">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                {train.trainName}
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                #{train.trainNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHighSpeed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              ⚡ Superfast High Speed
            </span>
          )}
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Daily Run
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Journey Timeline */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            {/* Origin */}
            <div className="text-left min-w-[100px]">
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {train.from?.departure || '06:00'}
              </p>
              <p className="font-bold text-xs text-slate-700 mt-0.5">{train.from?.name || 'Origin'}</p>
              <span className="text-[11px] font-mono text-slate-400">Departure</span>
            </div>

            {/* Travel Path visualizer */}
            <div className="flex-1 px-4 flex flex-col items-center">
              <span className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-600" /> Direct Run
              </span>
              <div className="w-full flex items-center relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-cyan-100 shrink-0" />
                <div className="h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 flex-1 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                    <ArrowRight className="w-3 h-3 text-cyan-600" />
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shrink-0" />
              </div>
            </div>

            {/* Destination */}
            <div className="text-right min-w-[100px]">
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {train.to?.arrival || '14:00'}
              </p>
              <p className="font-bold text-xs text-slate-700 mt-0.5">{train.to?.name || 'Destination'}</p>
              <span className="text-[11px] font-mono text-slate-400">Arrival</span>
            </div>
          </div>
        </div>

        {/* Seat Availability & Action */}
        <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-center">
          {/* Seat class pills */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {Object.entries(seatSummary)
              .filter(([k]) => k !== 'total')
              .map(([type, count]) => (
                <div
                  key={type}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 ${
                    count > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="font-bold">{formatSeatType(type)}</span>
                  <span className="text-[11px] font-mono font-bold">
                    {count > 0 ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> {count}
                      </span>
                    ) : (
                      'WL'
                    )}
                  </span>
                </div>
              ))}
          </div>

          {schedule && schedule.status !== 'CANCELLED' ? (
            <Button
              onClick={handleCheckAvailability}
              className="w-full py-2.5 text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-primary-900 hover:from-cyan-500 hover:to-primary-800 text-white shadow-md hover:shadow-neon"
            >
              Select Berths & Book
            </Button>
          ) : (
            <div className="text-center py-2 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
              {schedule?.status === 'CANCELLED' ? 'Schedule Suspended' : 'No Current Runs'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
