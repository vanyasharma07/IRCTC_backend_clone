import { formatCurrency, formatSeatType, formatDate } from '../../utils/format';
import { Train, Calendar, Receipt } from 'lucide-react';

export default function BookingSummary({ train, seats, totalPrice, departureDate }) {
  const irctcFee = 15;
  const grandTotal = (totalPrice || 0) + irctcFee;

  return (
    <div className="card bg-white border border-slate-200/90 shadow-glass">
      <div className="flex items-center gap-2 pb-3.5 mb-4 border-b border-slate-100">
        <Receipt className="w-4 h-4 text-cyan-600" />
        <h3 className="text-base font-bold text-slate-900">Fare Summary</h3>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Train className="w-4 h-4 text-blue-700" />
          <p className="font-bold text-slate-900 text-sm">{train?.trainName}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Train #{train?.trainNumber}</span>
          {departureDate && (
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Calendar className="w-3 h-3 text-cyan-600" />
              {formatDate(departureDate)}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 text-xs mb-4">
        <div className="py-2 flex justify-between font-bold text-slate-500 uppercase tracking-wider text-[10px]">
          <span>Seat Allocation</span>
          <span>Fare</span>
        </div>
        {seats.map((s) => (
          <div key={s.seatId} className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800">Seat #{s.seatNumber}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                {formatSeatType(s.seatType)}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-800">{formatCurrency(s.price)}</span>
          </div>
        ))}
        <div className="py-2 flex items-center justify-between text-slate-500">
          <span>IRCTC Convenience Fee (incl. GST)</span>
          <span className="font-mono font-semibold text-slate-700">{formatCurrency(irctcFee)}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Payable</p>
          <p className="text-[10px] text-slate-400">Includes all taxes</p>
        </div>
        <p className="text-2xl font-black text-slate-900 font-mono text-right">
          {formatCurrency(grandTotal)}
        </p>
      </div>
    </div>
  );
}
