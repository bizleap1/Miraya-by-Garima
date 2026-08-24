import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export default function AdminBroadcastSection({ token, API_BASE_URL }) {
  const [form, setForm] = useState({ target: 'all', recipientEmail: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stock-notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Broadcast Email sent successfully!');
        setForm({ target: 'all', recipientEmail: '', subject: '', message: '' });
      }
    } catch (err) {
      alert('Email send failed!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-subpage" style={{ maxWidth: '650px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
        <Mail size={22} className="gold-text" />
        <h2 style={{ margin: 0 }}>Client Email Campaign Dispatcher</h2>
      </div>

      <form onSubmit={handleSubmit} className="broadcast-form-box">
        <div>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Target Recipient Group</label>
          <select
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          >
            <option value="all">All Registered Customers (Mass Broadcast)</option>
            <option value="single">Single Recipient Email</option>
          </select>
        </div>

        {form.target === 'single' && (
          <div>
            <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Target Client Email</label>
            <input
              type="email"
              required
              placeholder="client@example.com"
              value={form.recipientEmail}
              onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Email Subject Header</label>
          <input
            type="text"
            required
            placeholder="e.g. Exclusive New Arrivals & Autumn Sale!"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Announcement Body Content</label>
          <textarea
            rows={6}
            required
            placeholder="Write your email body text here..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Send size={16} /> {sending ? 'Dispatching...' : 'SEND ANNOUNCEMENT EMAIL'}
        </button>
      </form>
    </div>
  );
}
