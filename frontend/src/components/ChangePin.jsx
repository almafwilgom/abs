import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import api, { authHeaders } from '../api';

const initialForm = {
  current_pin: '',
  new_pin: '',
  confirm_pin: '',
};

function PinInput({ id, label, value, onChange, visible, onToggle, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          required
          value={value}
          onChange={onChange}
          className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePin({ onUnauthorized }) {
  const [form, setForm] = useState(initialForm);
  const [visible, setVisible] = useState({
    current_pin: false,
    new_pin: false,
    confirm_pin: false,
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleVisibility = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!/^\d{4,}$/.test(form.new_pin)) {
      setMessage({ text: 'New PIN must contain at least 4 digits.', type: 'error' });
      return;
    }

    if (form.new_pin !== form.confirm_pin) {
      setMessage({ text: 'New PIN and confirmation do not match.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/auth/change-pin', {
        current_pin: form.current_pin,
        new_pin: form.new_pin,
      }, authHeaders());

      setMessage({ text: res.data.message, type: 'success' });
      setForm(initialForm);
    } catch (err) {
      if (err.response?.status === 401) {
        onUnauthorized();
        return;
      }
      setMessage({ text: err.response?.data?.error || 'Unable to change PIN.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" /> Change PIN
      </h3>

      {message.text && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PinInput
          id="current-pin"
          label="Current PIN"
          value={form.current_pin}
          onChange={(e) => updateField('current_pin', e.target.value)}
          visible={visible.current_pin}
          onToggle={() => toggleVisibility('current_pin')}
          placeholder="Current PIN"
        />
        <PinInput
          id="new-pin"
          label="New PIN"
          value={form.new_pin}
          onChange={(e) => updateField('new_pin', e.target.value)}
          visible={visible.new_pin}
          onToggle={() => toggleVisibility('new_pin')}
          placeholder="4+ digits"
        />
        <PinInput
          id="confirm-pin"
          label="Confirm New PIN"
          value={form.confirm_pin}
          onChange={(e) => updateField('confirm_pin', e.target.value)}
          visible={visible.confirm_pin}
          onToggle={() => toggleVisibility('confirm_pin')}
          placeholder="Repeat new PIN"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition duration-200 disabled:opacity-60"
        >
          {saving ? 'Changing PIN...' : 'Change PIN'}
        </button>
      </form>
    </div>
  );
}
