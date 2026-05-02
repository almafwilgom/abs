import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';

export default function Layout({ setToken, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-xl tracking-tight">ABS</span>
              <div className="hidden md:flex space-x-4">
                <Link to="/dashboard" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  <Home className="w-4 h-4 mr-2" /> Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 transition"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <Outlet />
      </main>
      
      <footer className="bg-blue-950 text-blue-50 border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div>
            <span className="font-semibold tracking-wide">ABS</span>
            <span className="text-blue-200"> Banking made secure and simple.</span>
          </div>
          <p className="text-blue-200">&copy; 2026 Automated Banking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
