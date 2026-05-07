import { useState, useEffect } from 'react';
import { Users, DollarSign, Search, Filter, ArrowLeft, TrendingUp, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminPortal() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const key = 'abs_admin_2026'; // Admin key
        const res = await api.get(`/auth/debug/users?key=${key}`);
        setUsers(res.data.users);
      } catch (err) {
        setError('Failed to load admin data. Ensure you are authorized.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.account_number.includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  const avgBalance = users.length > 0 ? totalBalance / users.length : 0;

  const formatNaira = (val) => new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(val);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center text-gray-500 hover:text-indigo-600 mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics Portal</h1>
            <p className="text-gray-500">Real-time user data and system analysis</p>
          </div>
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 hidden md:block">
            <span className="text-xs font-mono text-gray-400">Key: PROD_ANALYSIS_MODE</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+100%</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Registered Users</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{users.length}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Total System Deposits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatNaira(totalBalance)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Average User Balance</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatNaira(avgBalance)}</h3>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by name, email, or account..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredUsers.length} users</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Account Number</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{user.account_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${user.balance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatNaira(user.balance)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
