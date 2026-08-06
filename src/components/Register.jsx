import React, { useState } from 'react';
import foremanIcon from '../assets/foreman_icon.svg';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

export default function Register({ onRegisterSuccess, switchToLogin }) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name cannot be empty';
    if (!formData.lastName.trim()) errors.lastName = 'Last name cannot be empty';
    if (!formData.email.trim()) errors.email = 'Email cannot be empty';

    if (!formData.password) {
      errors.password = 'Password cannot be empty';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showError('Please correct the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let extractedMessage = '';
        try {
          const json = JSON.parse(responseText);
          if (json.message) {
            extractedMessage = json.message;
          } else if (typeof json === 'object' && Object.keys(json).length > 0) {
            setFieldErrors(json);
            extractedMessage = 'Please fix the validation errors below.';
          }
        } catch {
          extractedMessage = responseText || 'Registration failed.';
        }
        showError(extractedMessage || 'Registration failed.');
        throw new Error(extractedMessage || 'Registration failed.');
      }

      showSuccess('User registered successfully! Please sign in below.');
      onRegisterSuccess('User registered successfully! Please sign in below.');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
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
          <p className="auth-subtitle">Create a new account</p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                maxLength={20}
                required
              />
              {fieldErrors.firstName && (
                <div className="form-error-text">{fieldErrors.firstName}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                maxLength={20}
                required
              />
              {fieldErrors.lastName && (
                <div className="form-error-text">{fieldErrors.lastName}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                maxLength={254}
                required
              />
              {fieldErrors.email && (
                <div className="form-error-text">{fieldErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {fieldErrors.password ? (
                <div className="form-error-text">{fieldErrors.password}</div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Requires min. 6 characters, 1 uppercase letter, and 1 special character.
                </div>
              )}
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <div className="auth-subtext">
          Already have an account?{' '}
          <a href="#login" onClick={(e) => { e.preventDefault(); switchToLogin(); }}>
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
