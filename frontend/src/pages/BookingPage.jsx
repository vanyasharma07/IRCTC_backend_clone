import { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useBookingStore } from '../store/booking.store';
import BookingSummary from '../components/booking/BookingSummary';
import PassengerList from '../components/booking/PassengerList';
import PaymentButton from '../components/booking/PaymentButton';
import { ArrowLeft, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const selectedTrain = useBookingStore((s) => s.selectedTrain);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const scheduleId = useBookingStore((s) => s.scheduleId);

  const seats = useMemo(() => Array.from(selectedSeats.values()), [selectedSeats]);
  const seatIds = useMemo(() => seats.map((s) => s.seatId), [seats]);
  const totalPrice = useMemo(() => seats.reduce((sum, s) => sum + (s.price || 0), 0), [seats]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm({
    mode: 'onChange',
  });

  useEffect(() => {
    if (seats.length === 0) {
      navigate('/search');
    }
  }, [seats.length, navigate]);

  if (seats.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Back button & Step Progress */}
      <div className="mb-8">
        <Link
          to={`/seats/${scheduleId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Change Berth Selection
        </Link>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">1. Select Train & Berths</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs font-bold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">2</span>
            <span className="truncate">2. Passenger Details</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium">
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
            <span className="truncate">3. Secure Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Passenger Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card bg-white border border-slate-200/90 shadow-glass">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Passenger Information</h2>
                <p className="text-xs text-slate-500">Provide government ID valid passenger names</p>
              </div>
            </div>

            <form id="passenger-form" onSubmit={handleSubmit(() => {})}>
              <PassengerList seats={seats} register={register} errors={errors} />
            </form>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>IRCTC Safe Guarantee:</strong> Tickets generated with instant QR verification. Concessions verified at platform check-in.
            </span>
          </div>
        </div>

        {/* Right: Booking Summary & Payment */}
        <div className="lg:col-span-5 space-y-6">
          <BookingSummary train={selectedTrain} seats={seats} totalPrice={totalPrice} />

          <PaymentButton
            passengers={getValues('passengers') || []}
            scheduleId={scheduleId}
            seatIds={seatIds}
            disabled={!isValid}
          />
        </div>
      </div>
    </div>
  );
}
