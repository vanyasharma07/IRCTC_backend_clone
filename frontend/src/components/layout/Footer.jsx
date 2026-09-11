import { Train, ShieldCheck, Zap, Headphones, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <Train className="w-5 h-5 text-cyan-400" />
              <span>IRCTC NextGen</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier high-speed passenger rail reservation system. Fast bookings, real-time seat inventory, and guaranteed refund management.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Encrypted</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Tatkal</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/search" className="hover:text-cyan-400 transition-colors">Search Trains</Link></li>
              <li><Link to="/bookings" className="hover:text-cyan-400 transition-colors">PNR & Booking History</Link></li>
              <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Sign In / Register</Link></li>
              <li><Link to="/admin" className="hover:text-cyan-400 transition-colors">Admin Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Popular Rail Corridors</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Vande Bharat: New Delhi ⇄ Varanasi</li>
              <li>Tejas Express: Mumbai ⇄ Goa</li>
              <li>Vande Bharat: Bengaluru ⇄ Chennai</li>
              <li>Rajdhani: Howrah ⇄ New Delhi</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Customer Support</h4>
            <p className="text-xs text-slate-400 mb-2">24x7 Rail Support Helpdesk</p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <Headphones className="w-4 h-4" />
                <span>Toll-Free Rail Helpline</span>
              </div>
              <span className="text-white font-mono text-sm font-bold">139</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} IRCTC NextGen — Ministry of Railways, Government of India.</p>
          <p className="flex items-center gap-1">
            Built with modern microservices architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
