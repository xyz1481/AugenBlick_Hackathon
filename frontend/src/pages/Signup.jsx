import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../api/config';

const PROFESSIONS = [
  'Investor',
  'Business Owner',
  'Supply Chain Manager',
  'Policy Analyst',
  'Student',
  'Journalist',
  'Citizen',
  'Other',
];

export default function Signup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    country: '',
    profession: PROFESSIONS[0],
  });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.email.trim() &&
      form.password &&
      form.phone.trim() &&
      form.country.trim() &&
      form.profession
    );
  }, [form]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          phone: form.phone,
          country: form.country,
          profession: form.profession,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setStatus({ type: 'success', message: data.message || 'Signup successful. You can log in now.' });
      setForm((p) => ({ ...p, password: '' }));
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Signup failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-container">
      <div style={{}} className="auth-card">
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link>
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@domain.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 555 0100"
                required
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                placeholder="Country"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Profession</label>
            <select
              value={form.profession}
              onChange={(e) => setForm((p) => ({ ...p, profession: e.target.value }))}
              required
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {status.type !== 'idle' && (
            <div
              role="status"
              className="auth-error"
              style={{
                background: status.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                borderColor: status.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                color: status.type === 'success' ? '#2ecc71' : '#ef4444',
              }}
            >
              {status.message}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={!canSubmit || submitting}>
            {submitting ? 'Creating account...' : 'Sign up and Register'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="back-link">← Back to homepage</Link>
        </div>
      </div>
    </div>
  );
}

