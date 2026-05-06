import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CreditCard, Eye, EyeOff } from 'lucide-react';
import api from '../api';

export default function Login({ setToken, setUser }) {
  const [account, setAccount] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState('Checking...');
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.get('/');
        setStatus('Online');
      } catch (err) {
        setStatus('Offline');
        console.error('Status check failed:', err);
      }
    };
    checkStatus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Clean inputs for mobile (trim spaces)
    const cleanAccountNumber = account.trim();
    const cleanPin = pin.trim();

    try {
      const res = await api.post('/auth/login', { 
        account_number: cleanAccountNumber, 
        pin: cleanPin 
      });
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Login failed.';
      
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        msg = err.response.data?.error || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // The request was made but no response was received
        msg = 'No response from server. The backend might be starting up (cold start) or down.';
      } else {
        // Something happened in setting up the request
        msg = err.message;
      }
      
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="mb-4 bg-red-600 text-white px-6 py-2 rounded-full font-bold animate-bounce shadow-lg">
        DEBUG VERSION 2.0 - CONNECTED TO RENDER
      </div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Secure Login</h2>
          <p className="text-gray-500 mt-2">Automated Banking System</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm">
            <p className="font-bold mb-1">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="account-number" className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="account-number"
                name="account_number"
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="pin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="****"
              />
              <button
                type="button"
                onClick={() => setShowPin((visible) => !visible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Access Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Create one</Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'Offline' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Backend: {status}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-2 text-center max-w-[200px]">
            NOTE: DB is ephemeral on Render Free. Data resets on every update.
          </div>
        </div>
      </div>
    </div>
  );
}
