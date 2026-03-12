import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api/config';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => form.identifier.trim() && form.password, [form]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/', { replace: true });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Login failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h2 className="auth-title">Log in</h2>
        <p className="auth-subtitle">
          New here? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create an account</Link>
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Phone</label>
            <input
              type="text"
              value={form.identifier}
              onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
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
              placeholder="••••••••"
              required
            />
          </div>

          {status.type !== 'idle' && (
            <div role="status" className="auth-error">
              {status.message}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={!canSubmit || submitting}>
            {submitting ? 'Signing in...' : 'Log in to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="back-link">← Back to homepage</Link>
        </div>
      </div>
    </div>
  );
}

