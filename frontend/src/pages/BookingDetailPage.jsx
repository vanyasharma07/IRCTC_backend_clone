import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookingPolling } from '../hooks/useBookingPolling';
import { bookingApi } from '../api/booking.api';
import { useToast } from '../components/ui/Toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import BookingStatusPoller from '../components/booking/BookingStatusPoller';
import { formatDate, formatDateTime, formatCurrency, formatSeatType } from '../utils/format';
import { Train, ArrowLeft, CheckCircle2, AlertOctagon, QrCode, Ticket, Users, Calendar, Clock, RotateCcw } from 'lucide-react';

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const { booking, loading, error, refresh } = useBookingPolling(bookingId);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const showToast = useToast();

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingApi.cancel(bookingId);
      showToast('Booking cancelled successfully. Refund initiated.', 'success');
      setShowCancel(false);
      refresh();
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Spinner size="lg" />
        <p className="text-slate-500 font-medium text-sm mt-4">Retrieving reservation status & chart details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card bg-rose-50 border border-rose-200 text-rose-800 p-8 text-center">
          <AlertOctagon className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Unable to Load Booking</h2>
          <p className="text-sm mt-2 text-rose-700">{error}</p>
          <Link to="/bookings" className="mt-6 inline-block btn-secondary text-xs px-4 py-2">
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const canCancel = ['CONFIRMED', 'PAYMENT_PENDING', 'SEATS_HELD'].includes(booking.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <Badge status={booking.status} className="text-xs px-3 py-1 font-black" />
      </div>

      <BookingStatusPoller status={booking.status} />

      {booking.status === 'CONFIRMED' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3.5 mb-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-emerald-900 text-base">Booking Confirmed & Verified</p>
            <p className="text-xs text-emerald-700">
              Your e-ticket is valid for travel. Please carry an original government photo ID during journey.
            </p>
          </div>
        </div>
      )}

      {booking.status === 'FAILED' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-rose-900 text-sm">Booking Could Not Be Completed</p>
            <p className="text-xs text-rose-700 mt-0.5">
              {booking.failureReason || 'Seats or payment was not confirmed in time. Any debited amount is being refunded.'}
            </p>
          </div>
        </div>
      )}

      {/* Ticket Pass Container */}
      <div className="card bg-white border border-slate-200/90 shadow-glass overflow-hidden mb-6 p-0">
        {/* Boarding Pass Header */}
        <div className="bg-gradient-to-r from-slate-950 via-primary-950 to-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{booking.trainName}</h2>
              <span className="font-mono text-xs font-bold text-cyan-300">
                Train #{booking.trainNumber}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Reservation Slip (ERS)</p>
            <p className="font-mono text-xl font-black text-cyan-400">ID: {booking.id}</p>
          </div>
        </div>

        {/* Train Details Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100 text-xs">
          <div>
            <p className="text-slate-400 font-semibold mb-0.5">Departure Date</p>
            <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              {formatDate(booking.departureDate)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-0.5">Booking Timestamp</p>
            <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-0.5">Seat Allocation</p>
            <p className="font-bold text-slate-800 text-sm">
              {booking.seatCount} Berth{booking.seatCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-0.5">Fare Paid</p>
            <p className="font-black text-cyan-700 text-base font-mono">
              {formatCurrency(booking.totalAmount)}
            </p>
          </div>
        </div>

        {/* Allocated Berths */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-sm text-slate-900">Confirmed Berths</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {booking.seats?.map((s) => (
              <div key={s.seatId} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-mono text-base font-black text-slate-900">Seat #{s.seatNumber}</p>
                  <p className="text-xs text-slate-500 font-semibold">{formatSeatType(s.seatType)}</p>
                </div>
                <span className="font-mono text-sm font-bold text-slate-700">{formatCurrency(s.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-sm text-slate-900">Passenger Manifest</h3>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Passenger Name</span>
                <span className="col-span-2">Age</span>
                <span className="col-span-3">Gender</span>
              </div>
              {booking.passengers.map((p, i) => (
                <div key={p.id || i} className="px-4 py-3 grid grid-cols-12 items-center text-slate-800">
                  <span className="col-span-1 font-mono font-bold text-slate-400">{i + 1}</span>
                  <span className="col-span-6 font-bold">{p.name}</span>
                  <span className="col-span-2 font-mono">{p.age}</span>
                  <span className="col-span-3 font-semibold">{p.gender}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {canCancel && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            onClick={() => setShowCancel(true)}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Cancel Reservation
          </Button>
        </div>
      )}

      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Ticket Reservation?"
        confirmText="Confirm Cancellation"
        onConfirm={handleCancel}
        loading={cancelling}
        danger
      >
        <p className="text-slate-600 text-sm leading-relaxed">
          Are you sure you wish to cancel booking <strong>#{booking.id}</strong>?
          {booking.status === 'CONFIRMED' && (
            <span className="block mt-2 font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs">
              ✓ Automated refund will be processed to your source account as per standard IRCTC cancellation rules.
            </span>
          )}
        </p>
      </Modal>
    </div>
  );
}
