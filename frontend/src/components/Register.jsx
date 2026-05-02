import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', pin: '', initial_deposit: 0 });
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedAccount(null);
    setCopied(false);

    try {
      const res = await api.post('/auth/register', form);
      setCreatedAccount({
        name: form.name,
        email: form.email,
        phone: form.phone,
        accountNumber: res.data.account_number,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleCopyAccountNumber = async () => {
    if (!createdAccount?.accountNumber) return;

    try {
      await navigator.clipboard.writeText(createdAccount.accountNumber);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Open an Account</h2>
          <p className="text-gray-500 mt-2">Join the Automated Banking System</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="08012345678 or +2348012345678"
                pattern="(?:\+?234|0)[789][01][0-9]{8}"
                title="Use a Nigerian mobile number, for example 08012345678 or +2348012345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={form.pin}
                  onChange={(e) => updateForm('pin', e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="4+ digits"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Deposit (NGN)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-semibold">NGN</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.initial_deposit}
                  onChange={(e) => updateForm('initial_deposit', Number(e.target.value))}
                  className="pl-14 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition duration-200 mt-4">
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>

      {createdAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-7 text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold">Welcome to ABS, {createdAccount.name}</h3>
              <p className="text-blue-100 mt-2 text-sm">Your account has been created successfully.</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Your Account Number</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-bold text-gray-900">{createdAccount.accountNumber}</p>
                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className="rounded-lg border border-blue-200 bg-white p-2 text-blue-700 hover:bg-blue-100 transition"
                    aria-label="Copy account number"
                    title="Copy account number"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-blue-700 mt-2">{copied ? 'Copied to clipboard.' : 'Keep this number safe for login.'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900 text-right">{createdAccount.email}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900 text-right">{createdAccount.phone}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={goToLogin}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
