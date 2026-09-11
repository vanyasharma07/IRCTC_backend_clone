import { formatSeatType, formatCurrency } from '../../utils/format';
import { Check } from 'lucide-react';

const STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-500 hover:shadow-sm cursor-pointer active:scale-95',
  LOCKED: 'bg-amber-50 border-amber-300 text-amber-800 cursor-not-allowed opacity-60',
  BOOKED: 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50',
  CANCELLED: 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-40',
  SELECTED: 'bg-gradient-to-tr from-cyan-600 to-blue-600 border-cyan-400 text-white cursor-pointer shadow-neon ring-2 ring-cyan-200/80 scale-105',
};

export default function SeatTile({ seat, isSelected, onToggle }) {
  const effectiveStatus = seat.segmentStatus
    ? (seat.segmentStatus === 'AVAILABLE' ? 'AVAILABLE' : 'BOOKED')
    : seat.status;
  const status = isSelected ? 'SELECTED' : effectiveStatus;
  const canSelect = effectiveStatus === 'AVAILABLE';

  return (
    <button
      onClick={() => canSelect && onToggle(seat)}
      disabled={!canSelect && !isSelected}
      className={`border rounded-xl p-2.5 text-center transition-all duration-200 min-w-[76px] flex flex-col items-center justify-between gap-1 relative ${STATUS_STYLES[status]}`}
      title={`Seat #${seat.seatNumber} - ${formatSeatType(seat.seatType)} - ${formatCurrency(seat.price)}`}
    >
      {isSelected && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-sm">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      )}
      <p className={`text-sm font-black font-mono tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
        #{seat.seatNumber}
      </p>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-1 py-0.2 rounded ${
        isSelected ? 'bg-white/20 text-cyan-100' : 'bg-slate-200/60 text-slate-600'
      }`}>
        {formatSeatType(seat.seatType)}
      </span>
      <p className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-700'}`}>
        {formatCurrency(seat.price)}
      </p>
    </button>
  );
}
