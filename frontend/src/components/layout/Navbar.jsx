import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Train, Search, Ticket, ShieldAlert, LogOut, User as UserIcon, Zap } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-950/90 backdrop-blur-xl text-white sticky top-0 z-40 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-neon text-white transition-transform duration-300 group-hover:scale-105">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">IRCTC</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  NextGen
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                High-Speed Rail Network
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <div className="hidden lg:flex items-center gap-2 mr-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Network Active</span>
            </div>

            <Link
              to="/search"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/search')
                  ? 'bg-white/15 text-white font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Search</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/bookings"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive('/bookings')
                      ? 'bg-white/15 text-white font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>My Bookings</span>
                </Link>

                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive('/admin')
                      ? 'bg-white/15 text-white font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/15">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {user?.firstName ? user.firstName[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 hidden md:inline">
                      {user?.firstName || 'User'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 ml-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-neon transition-all duration-200"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
