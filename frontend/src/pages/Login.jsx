import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (user) navigate(user.role === 'hr_admin' ? '/dashboard' : '/my-profile', { replace: true }); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(form.username, form.password);
      navigate(loggedInUser.role === 'hr_admin' ? '/dashboard' : '/my-profile', { replace: true });
    } catch (err) {
      console.error('Login Error:', err);
      const msg = err.response?.data?.message || err.message || 'Login failed';
      if (msg.toLowerCase().includes('password')) setError('Incorrect password. Please try again.');
      else if (msg.toLowerCase().includes('user') || msg.toLowerCase().includes('not found')) setError('User not found. Check your username.');
      else if (err.message === 'Network Error') setError('Network Error: Cannot connect to backend server. Ensure it is running and CORS is allowed.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(29,78,216,0.1)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', top: '40%', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(96,165,250,0.05)', filter: 'blur(40px)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440 }} className="fade-in">
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.35)', padding: '40px 40px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>HR</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>CRCCF HRMS</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Human Resource Management System</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '10px 14px', marginBottom: 20,
              }}>
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Employee ID / Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="e.g., EMP0001 or admin"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  style={{
                    width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                    border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, background: '#f9fafb',
                    outline: 'none', transition: 'all 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{
                    width: '100%', paddingLeft: 40, paddingRight: 44, paddingTop: 11, paddingBottom: 11,
                    border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, background: '#f9fafb',
                    outline: 'none', transition: 'all 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f9fafb'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}>
              {loading && <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/></svg>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo Credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 12, color: '#1d4ed8' }}><strong>HR Admin:</strong> admin / Admin@123</p>
              <p style={{ fontSize: 12, color: '#1d4ed8' }}><strong>Employee:</strong> EMP0001 / rahul0315</p>
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 20 }}>
          © 2025 CRCCF. All rights reserved. · Secure Login
        </p>
      </div>
    </div>
  );
}
