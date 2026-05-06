import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Banknote, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, Eye, EyeOff, X, User as UserIcon } from 'lucide-react';
import api, { authHeaders, clearStoredSession } from '../api';
import ChangePin from './ChangePin';

const formatNaira = (value) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
}).format(Number(value) || 0);

export default function Dashboard({ user, setUser, setToken }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('Deposit');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);
  const [transactionModal, setTransactionModal] = useState(null);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    clearStoredSession();
    setToken('');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate, setToken, setUser]);

  const fetchData = useCallback(async () => {
    try {
      const config = authHeaders();
      const balRes = await api.get('/transactions/balance', config);
      setBalance(balRes.data.balance);
      setUser((currentUser) => currentUser ? { ...currentUser, balance: balRes.data.balance } : currentUser);

      const txRes = await api.get('/transactions/history', config);
      setTransactions(txRes.data.transactions);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        handleUnauthorized();
      }
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, setUser]);

  useEffect(() => {
    // The dashboard intentionally fetches server state when the protected view mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleTransaction = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    const transactionAmount = Number(amount);

    if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
      setMessage({ text: 'Please enter a valid amount.', type: 'error' });
      return;
    }

    setTransactionModal({
      status: 'confirm',
      action,
      amount: transactionAmount,
    });
  };

  const closeTransactionModal = () => {
    if (!transactionSubmitting) {
      setTransactionModal(null);
    }
  };

  const executeTransaction = async () => {
    if (!transactionModal) return;

    setTransactionSubmitting(true);
    try {
      const endpoint = transactionModal.action === 'Deposit' ? '/deposit' : '/withdraw';
      const res = await api.post(`/transactions${endpoint}`, { amount: transactionModal.amount }, authHeaders());

      setTransactionModal({
        status: 'success',
        action: transactionModal.action,
        amount: transactionModal.amount,
        message: res.data.message,
        newBalance: res.data.new_balance,
      });
      setAmount('');
      void fetchData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setTransactionModal({
        status: 'error',
        action: transactionModal.action,
        amount: transactionModal.amount,
        message: err.response?.data?.error || 'Transaction failed.',
      });
    } finally {
      setTransactionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
            <p className="text-gray-500 mt-1 flex items-center">
              <UserIcon className="w-4 h-4 mr-1" /> Account:
              <span className="font-mono ml-1 text-gray-700">{user?.account_number}</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Banknote className="w-24 h-24" />
          </div>
          <div className="z-10 flex items-center justify-between gap-3">
            <p className="text-blue-100 font-medium">Available Balance</p>
            <button
              type="button"
              onClick={() => setShowBalance((visible) => !visible)}
              className="rounded-full p-2 text-blue-100 hover:bg-white/15 hover:text-white transition"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <h2 className="text-4xl font-bold mt-2 z-10">
            {showBalance ? formatNaira(balance) : 'NGN ******'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Transaction</h3>

            <div className="flex space-x-2 mb-6">
              <button
                type="button"
                onClick={() => { setAction('Deposit'); setMessage({ text: '', type: '' }); }}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${action === 'Deposit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => { setAction('Withdraw'); setMessage({ text: '', type: '' }); }}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${action === 'Withdraw' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                Withdraw
              </button>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleTransaction}>
              <div className="mb-4">
                <label htmlFor="tx-amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (NGN)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-semibold">NGN</div>
                  <input
                    id="tx-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex justify-center items-center"
              >
                {action === 'Deposit' ? <ArrowDownRight className="w-5 h-5 mr-2" /> : <ArrowUpRight className="w-5 h-5 mr-2" />}
                Confirm {action}
              </button>
            </form>
          </div>

          <ChangePin onUnauthorized={handleUnauthorized} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" /> Recent Transactions
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading history...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-100 h-[300px] overflow-y-auto pr-2">
                {transactions.map((tx) => (
                  <li key={tx.transaction_id} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${tx.type === 'Deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'Deposit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tx.type}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'Deposit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {transactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className={`${transactionModal.action === 'Deposit' ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} px-6 py-6 text-white relative`}>
              <button
                type="button"
                onClick={closeTransactionModal}
                disabled={transactionSubmitting}
                className="absolute top-4 right-4 rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition disabled:opacity-50"
                aria-label="Close transaction modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-4">
                {transactionModal.status === 'error' ? (
                  <AlertCircle className="w-8 h-8" />
                ) : transactionModal.status === 'success' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : transactionModal.action === 'Deposit' ? (
                  <ArrowDownRight className="w-8 h-8" />
                ) : (
                  <ArrowUpRight className="w-8 h-8" />
                )}
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                {transactionModal.status === 'confirm' ? 'Confirm transaction' : transactionModal.status === 'success' ? 'Transaction successful' : 'Transaction failed'}
              </p>
              <h3 className="text-2xl font-bold mt-1">{transactionModal.action}</h3>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex justify-between gap-4 pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Account</span>
                  <span className="font-mono font-semibold text-gray-900">{user?.account_number}</span>
                </div>
                <div className="flex justify-between gap-4 py-3 border-b border-gray-200">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-gray-900">{formatNaira(transactionModal.amount)}</span>
                </div>
                <div className="flex justify-between gap-4 pt-3">
                  <span className="text-gray-500">Type</span>
                  <span className={`font-semibold ${transactionModal.action === 'Deposit' ? 'text-green-700' : 'text-blue-700'}`}>
                    {transactionModal.action}
                  </span>
                </div>
              </div>

              {transactionModal.status === 'confirm' && (
                <p className="text-sm text-gray-600">
                  Please review the details carefully before confirming this {transactionModal.action.toLowerCase()}.
                </p>
              )}

              {transactionModal.status !== 'confirm' && (
                <div className={`${transactionModal.status === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} rounded-xl border p-4 text-sm`}>
                  <p className="font-semibold">{transactionModal.message}</p>
                  {transactionModal.status === 'success' && (
                    <p className="mt-1">New balance: {formatNaira(transactionModal.newBalance)}</p>
                  )}
                </div>
              )}

              {transactionModal.status === 'confirm' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeTransactionModal}
                    disabled={transactionSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeTransaction}
                    disabled={transactionSubmitting}
                    className={`${transactionModal.action === 'Deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg px-4 py-3 font-semibold text-white transition disabled:opacity-60`}
                  >
                    {transactionSubmitting ? 'Processing...' : `Confirm ${transactionModal.action}`}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={closeTransactionModal}
                  className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800 transition"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
