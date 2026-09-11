export const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];

export const SEAT_TYPE_LABELS = {
  LOWER: 'Lower',
  MIDDLE: 'Middle',
  UPPER: 'Upper',
  SIDE_LOWER: 'Side Lower',
  SIDE_UPPER: 'Side Upper',
};

export const SEAT_STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
  LOCKED: 'bg-amber-400 text-amber-950 font-bold',
  BOOKED: 'bg-slate-300 text-slate-500 cursor-not-allowed',
  SELECTED: 'bg-cyan-500 text-white ring-2 ring-cyan-300 shadow-neon',
};

export const BOOKING_STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  SEATS_HELD: 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse',
  PAYMENT_PENDING: 'bg-orange-50 text-orange-700 border border-orange-200',
  CONFIRMING: 'bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm font-bold',
  CANCELLING: 'bg-rose-50 text-rose-700 border border-rose-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border border-slate-200',
  EXPIRED: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export const MAX_SEATS_PER_BOOKING = 6;
