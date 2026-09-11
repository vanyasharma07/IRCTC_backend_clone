import { formatDate } from '../../utils/format';
import { Train, Calendar, CheckCircle2, Lock, Ban, Layers } from 'lucide-react';

export default function AvailabilitySummary({ availability, train }) {
  if (!availability) return null;

  return (
    <div className="card bg-white border border-slate-200/90 shadow-glass mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-sm">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {train?.trainName || availability.trainName}
              </h2>
              <span className="font-mono text-xs font-bold text-slate-500">
                Train #{train?.trainNumber || availability.trainNumber}
              </span>
            </div>
          </div>

          {train?.from && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{train.from.name}</span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{train.to.name}</span>
            </div>
          )}

          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
            Departure Date: <strong className="text-slate-800">{formatDate(availability.departureDate)}</strong>
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Available</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 font-mono">{availability.available}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-bold mb-0.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked</span>
            </div>
            <p className="text-2xl font-black text-amber-700 font-mono">{availability.locked}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-0.5">
              <Ban className="w-3.5 h-3.5" />
              <span>Booked</span>
            </div>
            <p className="text-2xl font-black text-slate-600 font-mono">{availability.booked}</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-bold mb-0.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Total Seats</span>
            </div>
            <p className="text-2xl font-black text-blue-800 font-mono">{availability.totalSeats}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
