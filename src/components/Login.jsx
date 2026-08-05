import React, { useState } from 'react';
import foremanIcon from '../assets/foreman_icon.svg';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

export default function Login({ onLoginSuccess, switchToRegister, successMessage }) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.email || !formData.password) {
      const msg = 'Please enter both email and password.';
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const text = await response.text();

      if (!response.ok) {
        let message = 'Invalid email or password.';
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch {
          if (text) message = text;
        }

        if (response.status === 401 || response.status === 404 || response.status === 400 || message === 'Something went wrong.') {
          message = 'Invalid email or password.';
        }

        showError(message);
        throw new Error(message);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server.');
      }

      if (data && data.token) {
        localStorage.setItem('foreman_token', data.token);
        showSuccess('Welcome back! Successfully logged in.');
        onLoginSuccess(data.token);
      } else {
        throw new Error('No authentication token received from server.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to Foreman backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <img 
              src={foremanIcon} 
              alt="Foreman Logo" 
              style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, objectFit: 'contain' }} 
            />
            <span>Foreman</span>
          </div>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>{successMessage}</div>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <div className="auth-subtext">
          New to Foreman?{' '}
          <a href="#register" onClick={(e) => { e.preventDefault(); switchToRegister(); }}>
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
