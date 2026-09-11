import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../store/booking.store';
import { formatCurrency } from '../../utils/format';
import { MAX_SEATS_PER_BOOKING } from '../../utils/constants';
import Button from '../ui/Button';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SelectionSummary() {
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const navigate = useNavigate();

  const count = selectedSeats.size;
  let totalPrice = 0;
  selectedSeats.forEach((s) => (totalPrice += s.price || 0));

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-slate-950/95 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl border border-white/20 z-40 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">
                {count} Seat{count !== 1 ? 's' : ''} Selected
              </span>
              <span className="text-xs text-slate-400">
                (Max {MAX_SEATS_PER_BOOKING})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Total Fare:</span>
              <span className="text-lg font-black text-cyan-300 font-mono">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/booking')}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-primary-800 hover:from-cyan-400 hover:to-primary-700 text-white font-bold rounded-xl shadow-neon flex items-center justify-center gap-2"
          >
            <span>Proceed to Passenger Info</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
