import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.api';
import { useBookingStore } from '../store/booking.store';
import { useToast } from '../components/ui/Toast';
import AvailabilitySummary from '../components/seats/AvailabilitySummary';
import SeatFilters from '../components/seats/SeatFilters';
import SeatGrid from '../components/seats/SeatGrid';
import SeatLegend from '../components/seats/SeatLegend';
import SelectionSummary from '../components/seats/SelectionSummary';
import Spinner from '../components/ui/Spinner';
import { MAX_SEATS_PER_BOOKING } from '../utils/constants';
import { ArrowLeft, Clock, Info, ShieldCheck } from 'lucide-react';

export default function SeatSelectionPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const selectedTrain = useBookingStore((s) => s.selectedTrain);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const toggleSeat = useBookingStore((s) => s.toggleSeat);
  const setSelectedTrain = useBookingStore((s) => s.setSelectedTrain);
  const fromStation = useBookingStore((s) => s.fromStation);
  const toStation = useBookingStore((s) => s.toStation);

  const [availability, setAvailability] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);

  // 10-minute visual countdown timer
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    if (selectedSeats.size > 0) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSecondsLeft(600);
    }
  }, [selectedSeats.size]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const seatParams = {};
        if (fromStation?.sequenceNumber && toStation?.sequenceNumber) {
          seatParams.fromSeq = fromStation.sequenceNumber;
          seatParams.toSeq = toStation.sequenceNumber;
        }

        const [availRes, seatsRes] = await Promise.all([
          inventoryApi.getAvailability(scheduleId),
          inventoryApi.getSeats(scheduleId, seatParams),
        ]);
        const rawAvail = availRes.data || availRes;
        const seatList = (seatsRes.data?.seats || seatsRes.seats || []).sort((a, b) => a.seatNumber - b.seatNumber);
        setSeats(seatList);

        if (seatParams.fromSeq && seatParams.toSeq && seatList.some((s) => s.segmentStatus)) {
          const segAvail = seatList.filter((s) => s.segmentStatus === 'AVAILABLE').length;
          const segUnavail = seatList.filter((s) => s.segmentStatus === 'UNAVAILABLE').length;
          setAvailability({
            ...rawAvail,
            available: segAvail,
            booked: segUnavail,
            locked: 0,
          });
        } else {
          setAvailability(rawAvail);
        }

        if (!selectedTrain) {
          const avail = availRes.data || availRes;
          setSelectedTrain(
            {
              trainName: avail.trainName,
              trainNumber: avail.trainNumber,
              trainId: avail.trainId,
            },
            scheduleId
          );
        }
      } catch (err) {
        showToast(err.message || 'Failed to load seats', 'error');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [scheduleId]);

  const handleToggleSeat = (seat) => {
    const result = toggleSeat(seat);
    if (result === false) {
      showToast(`Maximum ${MAX_SEATS_PER_BOOKING} seats can be selected`, 'warning');
    }
  };

  const filteredSeats = filter ? seats.filter((s) => s.seatType === filter) : seats;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Spinner size="lg" />
        <p className="text-slate-500 font-medium text-sm mt-4">Retrieving real-time coach inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      {/* Top Breadcrumb & Lock Timer Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Train Search Results
        </Link>

        {selectedSeats.size > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Seat Hold Active: {formatTimer(secondsLeft)}</span>
          </div>
        )}
      </div>

      <AvailabilitySummary availability={availability} train={selectedTrain} />

      {/* Main Seat Selection Card */}
      <div className="card bg-white border border-slate-200/90 shadow-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Interactive Coach Berth Map</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on green berths to select. Up to {MAX_SEATS_PER_BOOKING} passengers allowed per ticket.
            </p>
          </div>
          <SeatLegend />
        </div>

        {/* Coach Berth Tip */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <span>
            <strong>Berth Allocations:</strong> Lower (LB), Middle (MB), and Upper (UB) occupy the primary compartments; Side Lower (SL) and Side Upper (SU) face the aisle. Senior citizens are prioritized for Lower Berths.
          </span>
        </div>

        <SeatFilters activeFilter={filter} onChange={setFilter} />
        <SeatGrid seats={filteredSeats} selectedSeats={selectedSeats} onToggleSeat={handleToggleSeat} />
      </div>

      <SelectionSummary />
    </div>
  );
}
